import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Image, Platform } from 'react-native';

import { BrandImages } from '@/constants/brand';
import { signedUrlFor } from '@/remote/photos';
import { localPhotoExists } from '@/services/photoStorage';
import { catalogReportPhotos, surveyReportFileName } from '@/lib/surveyReportData';
import { buildSurveyReportHtml, type PreparedShot } from '@/lib/surveyReportHtml';
import { needsPhotoUpload } from '@/lib/survey';
import type { Client, PhotoEvidence, Project, Survey } from '@/types';

const REPORT_MAX_EDGE = 1000;
const REPORT_JPEG_QUALITY = 0.58;

export type SurveyReportInput = {
  survey: Survey;
  client?: Client;
  project?: Project;
  technician: string;
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

async function fileToBase64(uri: string) {
  return new File(uri).base64();
}

async function uriToBase64(uri: string) {
  if (uri.startsWith('data:')) {
    return uri.replace(/^data:[^;]+;base64,/, '');
  }
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('http');
    return arrayBufferToBase64(await response.arrayBuffer());
  }
  return fileToBase64(uri);
}

function probeSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

async function compressForReport(uri: string) {
  if (!uri || uri.startsWith('http') || uri.startsWith('data:')) return uri;
  try {
    const context = ImageManipulator.manipulate(uri);
    let width = 0;
    let height = 0;
    try {
      const size = await probeSize(uri);
      width = size.width;
      height = size.height;
    } catch {
      const probed = await context.renderAsync();
      width = probed.width;
      height = probed.height;
      probed.release();
      context.reset();
    }
    const longest = Math.max(width, height);
    if (longest > REPORT_MAX_EDGE) {
      if (width >= height) context.resize({ width: REPORT_MAX_EDGE });
      else context.resize({ height: REPORT_MAX_EDGE });
    }
    const image = await context.renderAsync();
    const saved = await image.saveAsync({
      compress: REPORT_JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });
    image.release();
    context.release();
    return saved.uri;
  } catch {
    return uri;
  }
}

async function resolvePhotoUri(photo: PhotoEvidence) {
  if (photo.uri && !photo.uri.startsWith('http') && (await localPhotoExists(photo.uri))) {
    return photo.uri;
  }
  if (photo.storagePath) {
    return (await signedUrlFor(photo.storagePath)) ?? photo.uri;
  }
  return photo.uri;
}

async function encodeImage(uri?: string) {
  if (!uri) return undefined;
  const prepared = await compressForReport(uri);
  const base64 = await uriToBase64(prepared);
  return `data:image/jpeg;base64,${base64}`;
}

async function encodeLogo() {
  try {
    const asset = Asset.fromModule(BrandImages.logoBlack);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) return undefined;
    const base64 = await uriToBase64(uri);
    return `data:image/png;base64,${base64}`;
  } catch {
    return undefined;
  }
}

async function encodeShots(survey: Survey): Promise<PreparedShot[]> {
  const catalog = catalogReportPhotos(survey);
  const prepared: PreparedShot[] = [];
  for (const shot of catalog) {
    try {
      const uri = await resolvePhotoUri(shot.photo);
      prepared.push({ ...shot, dataUri: await encodeImage(uri) });
    } catch {
      prepared.push({ ...shot });
    }
  }
  return prepared;
}

async function saveNamedPdf(printedUri: string, fileName: string) {
  if (Platform.OS === 'web') return printedUri;
  const destination = new File(Paths.cache, fileName);
  if (destination.exists) destination.delete();

  try {
    await new File(printedUri).copy(destination);
    return destination.uri;
  } catch {
    try {
      const response = await fetch(printedUri);
      if (!response.ok) return printedUri;
      destination.write(new Uint8Array(await response.arrayBuffer()));
      return destination.uri;
    } catch {
      return printedUri;
    }
  }
}

export function surveyReportWarnings(input: SurveyReportInput) {
  const warnings: string[] = [];
  const missing = input.survey.photos.concat(
    input.survey.sectors.flatMap((sector) => [...sector.photos, ...sector.elements.flatMap((element) => element.photos)]),
  );
  if (missing.some((photo) => needsPhotoUpload(photo))) {
    warnings.push('Algunas fotos aún se están subiendo. El informe usa las copias de este dispositivo.');
  }
  return warnings;
}

function isShareCancelled(error: unknown) {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return message.includes('cancel') || message.includes('dismiss') || message.includes('did not share');
}

export async function shareSurveyReport(input: SurveyReportInput) {
  const [logoSrc, shots] = await Promise.all([encodeLogo(), encodeShots(input.survey)]);
  const html = buildSurveyReportHtml({ ...input, shots, logoSrc });
  const fileName = surveyReportFileName(input.survey, input.client, input.project);

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return { uri: undefined as string | undefined, fileName, printed: true };
  }

  const printed = await Print.printToFileAsync({ html });
  let uri = printed.uri;
  try {
    uri = await saveNamedPdf(printed.uri, fileName);
  } catch {
    uri = printed.uri;
  }
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    await Print.printAsync({ uri });
    return { uri, fileName, printed: true };
  }

  try {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Compartir informe PDF',
    });
  } catch (error) {
    if (!isShareCancelled(error)) throw error;
  }
  return { uri, fileName, printed: false };
}
