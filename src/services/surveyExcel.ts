import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import { Image, Platform } from 'react-native';

import {
  CONDITION_LABELS,
  CORROSION_LEVEL_LABELS,
  ELEMENT_TYPE_LABELS,
  MATERIAL_LABELS,
  SERVICE_TYPE_LABELS,
  SEVERITY_LABELS,
  SURVEY_STATUS_LABELS,
  TRAFFIC_LABELS,
} from '@/constants/labels';
import { exposureList, problemList, sectorProblemList, useList } from '@/lib/display';
import { formatDateLong, formatTime } from '@/lib/format';
import {
  catalogReportPhotos,
  clientFields,
  projectFields,
  reportKpis,
  sectorPriorityLine,
  serviceConditionFields,
  shotsForSector,
  surveyExportFileName,
  visitFields,
  type ReportShot,
} from '@/lib/surveyReportData';
import { collectElements, elementCount, photoCount } from '@/lib/survey';
import { surveyArea } from '@/lib/service';
import { buildXlsx, headerRow, titleRows, type XlsxImage, type XlsxRow, type XlsxSheet } from '@/lib/xlsxBuild';
import { signedUrlFor } from '@/remote/photos';
import { localPhotoExists } from '@/services/photoStorage';
import type { PhotoEvidence } from '@/types';

import type { SurveyReportInput } from './surveyReport';

const PHOTO_EDGE = 720;
const PHOTO_QUALITY = 0.62;
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const XLSX_UTI = 'org.openxmlformats.spreadsheetml.sheet';

function dash(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === 'Sin problemas registrados') return '—';
  return trimmed;
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function probeSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
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

async function jpegBytesForUri(uri?: string) {
  if (!uri) return undefined;
  try {
    let source = uri;
    if (!uri.startsWith('http') && !uri.startsWith('data:')) {
      const context = ImageManipulator.manipulate(uri);
      try {
        const size = await probeSize(uri);
        const longest = Math.max(size.width, size.height);
        if (longest > PHOTO_EDGE) {
          if (size.width >= size.height) context.resize({ width: PHOTO_EDGE });
          else context.resize({ height: PHOTO_EDGE });
        }
      } catch {
        // Keep original size if probe fails.
      }
      const image = await context.renderAsync();
      const saved = await image.saveAsync({ compress: PHOTO_QUALITY, format: SaveFormat.JPEG });
      image.release();
      context.release();
      source = saved.uri;
    }

    if (source.startsWith('data:')) {
      return base64ToBytes(source.replace(/^data:[^;]+;base64,/, ''));
    }
    if (source.startsWith('http://') || source.startsWith('https://')) {
      const response = await fetch(source);
      if (!response.ok) return undefined;
      return new Uint8Array(await response.arrayBuffer());
    }
    return base64ToBytes(await new File(source).base64());
  } catch {
    return undefined;
  }
}

async function photoBytes(shots: ReportShot[]) {
  const images = new Map<string, Uint8Array>();
  for (const shot of shots) {
    try {
      const uri = await resolvePhotoUri(shot.photo);
      const bytes = await jpegBytesForUri(uri);
      if (bytes) images.set(shot.code, bytes);
    } catch {
      // Missing photos stay as empty cells.
    }
  }
  return images;
}

function kvSheet(name: string, subtitle: string, headers: string[], rows: Array<Array<string | number>>): XlsxSheet {
  const body: XlsxRow[] = rows.map((cells, index) => ({
    kind: index % 2 === 1 ? 'stripe' : 'body',
    cells,
    height: 18,
  }));
  return {
    name,
    columns: headers.length > 2 ? [16, 32, 72] : [32, 72],
    rows: [...titleRows(subtitle, headers.length), headerRow(headers), ...body],
  };
}

function tableSheet(
  name: string,
  subtitle: string,
  headers: string[],
  rows: Array<Array<string | number>>,
  widths: number[],
): XlsxSheet {
  const body: XlsxRow[] = rows.map((cells, index) => ({
    kind: index % 2 === 1 ? 'stripe' : 'body',
    cells,
    height: 36,
  }));
  return {
    name,
    columns: widths,
    rows: [...titleRows(subtitle, headers.length), headerRow(headers), ...body],
  };
}

function isShareCancelled(error: unknown) {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return message.includes('cancel') || message.includes('dismiss') || message.includes('did not share');
}

function downloadOnWeb(bytes: Uint8Array, fileName: string) {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function shareSurveyExcel(input: SurveyReportInput) {
  const { survey, client, project, technician } = input;
  const shots = catalogReportPhotos(survey);
  const images = await photoBytes(shots);
  const fileName = surveyExportFileName(survey, client, project, 'xlsx');
  const subtitle = `${survey.code} · ${client?.name || 'Cliente'} · ${project?.name || 'Recinto'}`;
  const area = surveyArea(survey);
  const kpis = reportKpis(survey);

  const resumen = kvSheet('1. Resumen', subtitle, ['Campo', 'Valor'], [
    ['Código', survey.code],
    ['Estado', SURVEY_STATUS_LABELS[survey.status]],
    ['Servicio', SERVICE_TYPE_LABELS[survey.serviceType]],
    ['Fecha', formatDateLong(survey.startedAt)],
    ['Hora de inicio', formatTime(survey.startedAt)],
    ['Técnico', technician],
    ['Cliente', client?.name || '—'],
    ['Recinto', project?.name || '—'],
    ...kpis.map((item) => [item.label, item.value]),
    ...(typeof area === 'number' ? [['Superficie total (m²)', area]] : []),
    ['Sectores', survey.sectors.length],
    ['Elementos', elementCount(survey)],
    ['Fotografías', photoCount(survey)],
    ['Conclusión', dash(survey.conclusion)],
    ['Prioridad de intervención', dash(sectorPriorityLine(survey))],
  ]);

  const cliente = kvSheet(
    '2. Cliente y recinto',
    `Datos comerciales y de faena · ${survey.code}`,
    ['Campo', 'Valor'],
    [
      ...clientFields(client).map((field) => [field.label, dash(field.value)]),
      ['', ''],
      ['Recinto / proyecto', ''],
      ...projectFields(client, project).map((field) => [field.label, dash(field.value)]),
    ],
  );
  const recintoHeaderIndex = 5 + clientFields(client).length + 1;
  if (cliente.rows[recintoHeaderIndex]) cliente.rows[recintoHeaderIndex].kind = 'header';

  const condiciones = kvSheet(
    '3. Condiciones',
    `Servicio y visita · ${survey.code}`,
    ['Grupo', 'Campo', 'Valor'],
    [
      ...serviceConditionFields(survey).map((field) => ['Servicio', field.label, dash(field.value)]),
      ...visitFields(survey).map((field) => ['Visita', field.label, dash(field.value)]),
      ['Visita', 'Observación general', dash(survey.generalObservations)],
      ['Visita', 'Retirar maquinaria', survey.machineryToRemove === 'yes' ? 'Sí' : survey.machineryToRemove === 'no' ? 'No' : '—'],
      ['Visita', 'Comentarios de faena', dash(survey.siteComments)],
    ],
  );

  const sectorRows = survey.sectors.map((sector, index) => {
    const range = shotsForSector(shots, sector);
    const codes = range.length ? `${range[0].code}${range.length > 1 ? ` – ${range[range.length - 1].code}` : ''}` : '—';
    return [
      String(index + 1).padStart(2, '0'),
      sector.name.trim() || 'Sin nombre',
      sector.approximateArea ?? '',
      CONDITION_LABELS[sector.condition],
      SEVERITY_LABELS[sector.severity],
      sector.trafficLevel ? TRAFFIC_LABELS[sector.trafficLevel] : '—',
      dash(useList(sector.uses, sector.otherUse)),
      dash(sectorProblemList(sector)),
      dash(exposureList(sector.exposures)),
      dash(sector.observations),
      dash(sector.recommendation),
      codes,
    ];
  });
  const sectores = tableSheet(
    '4. Sectores',
    `Una fila por sector · ${survey.code}`,
    ['N°', 'Sector', 'm²', 'Estado', 'Criticidad', 'Tráfico', 'Usos', 'Problemas', 'Exposiciones', 'Observación', 'Recomendación', 'Fotos'],
    sectorRows,
    [6, 22, 10, 12, 12, 10, 28, 36, 28, 42, 42, 14],
  );
  if (survey.sectors.some((sector) => typeof sector.approximateArea === 'number') && sectorRows.length > 0) {
    sectores.rows.push({
      kind: 'total',
      cells: ['', 'Total m²', { formula: `SUM(C6:C${5 + sectorRows.length})` }],
      height: 20,
    });
  }

  const elementos = tableSheet(
    '5. Elementos',
    `Una fila por elemento · ${survey.code}`,
    ['Sector', 'Tipo', 'Referencia', 'Material', 'Estado', 'Corrosión', 'Criticidad', 'Problemas', 'Exposiciones', 'Observación', 'Fotos'],
    collectElements(survey).map((element) => {
      const sector = survey.sectors.find((item) => item.id === element.sectorId);
      const codes = shots
        .filter((shot) => shot.photo.elementId === element.id)
        .map((shot) => shot.code)
        .join(', ');
      return [
        sector?.name.trim() || '—',
        ELEMENT_TYPE_LABELS[element.elementType],
        dash(element.reference),
        element.material ? MATERIAL_LABELS[element.material] : '—',
        CONDITION_LABELS[element.condition],
        element.corrosionLevel ? CORROSION_LEVEL_LABELS[element.corrosionLevel] : '—',
        SEVERITY_LABELS[element.severity],
        dash(problemList(element.problems, element.otherProblem)),
        dash(exposureList(element.exposures)),
        dash(element.observations),
        codes || '—',
      ];
    }),
    [22, 16, 18, 14, 12, 12, 12, 34, 22, 42, 14],
  );

  const fotoRows: XlsxRow[] = [...titleRows(`Evidencia fotográfica · ${survey.code}`, 5), headerRow(['Foto', 'Código', 'Ubicación', 'Categoría', 'Nota'])];
  const fotoImages: XlsxImage[] = [];
  let lastGroup = '';
  if (shots.length === 0) {
    fotoRows.push({ kind: 'muted', cells: ['Este levantamiento no tiene fotografías.'] });
  }
  for (const shot of shots) {
    if (shot.groupTitle !== lastGroup) {
      lastGroup = shot.groupTitle;
      fotoRows.push({ kind: 'group', cells: [shot.groupTitle, '', '', '', ''], height: 20 });
    }
    fotoRows.push({
      kind: 'code',
      cells: [images.get(shot.code) ? '' : 'Sin foto', shot.code, shot.groupTitle, shot.category, dash(shot.caption === 'Sin nota' ? '' : shot.caption)],
      height: 88,
    });
    const bytes = images.get(shot.code);
    if (bytes) {
      fotoImages.push({
        row: fotoRows.length - 1,
        col: 0,
        bytes,
        width: 168,
        height: 108,
      });
    }
  }

  const fotos: XlsxSheet = {
    name: '6. Fotos',
    columns: [28, 12, 36, 20, 42],
    rows: fotoRows,
    images: fotoImages,
  };

  const bytes = await buildXlsx([resumen, cliente, condiciones, sectores, elementos, fotos]);

  if (Platform.OS === 'web') {
    downloadOnWeb(bytes, fileName);
    return { uri: undefined as string | undefined, fileName };
  }

  const destination = new File(Paths.cache, fileName);
  if (destination.exists) destination.delete();
  destination.write(bytes);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Este dispositivo no puede compartir archivos Excel.');
  }
  try {
    await Sharing.shareAsync(destination.uri, {
      mimeType: XLSX_MIME,
      UTI: XLSX_UTI,
      dialogTitle: 'Compartir Excel',
    });
  } catch (error) {
    if (!isShareCancelled(error)) throw error;
  }
  return { uri: destination.uri, fileName };
}
