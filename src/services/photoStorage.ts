import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Image, Platform } from 'react-native';

import { createId } from '@/lib/id';

const PHOTO_MAX_EDGE = 1600;
const PHOTO_JPEG_QUALITY = 0.72;

function photosDirectory() {
  return new Directory(Paths.document, 'survey-photos');
}

function canUseLocalFiles() {
  return Platform.OS !== 'web' && Boolean(Paths.document);
}

function probeSize(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

export async function compressSurveyPhoto(sourceUri: string) {
  if (!sourceUri || sourceUri.startsWith('http')) return sourceUri;

  try {
    const context = ImageManipulator.manipulate(sourceUri);
    let width = 0;
    let height = 0;
    try {
      const size = await probeSize(sourceUri);
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
    if (longest > PHOTO_MAX_EDGE) {
      if (width >= height) context.resize({ width: PHOTO_MAX_EDGE });
      else context.resize({ height: PHOTO_MAX_EDGE });
    }

    const image = await context.renderAsync();
    const saved = await image.saveAsync({
      compress: PHOTO_JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });
    image.release();
    context.release();
    return saved.uri;
  } catch {
    return sourceUri;
  }
}

export async function savePhotoLocally(sourceUri: string) {
  const compressed = await compressSurveyPhoto(sourceUri);
  if (!canUseLocalFiles() || compressed.startsWith('http')) {
    return compressed;
  }

  try {
    const directory = photosDirectory();
    if (!directory.exists) {
      directory.create();
    }

    const destination = new File(directory, `${createId('pho')}.jpg`);
    new File(compressed).copy(destination);
    return destination.uri;
  } catch {
    return compressed;
  }
}

export async function deleteLocalPhoto(uri?: string) {
  if (!uri || !canUseLocalFiles()) return;

  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // The original picker URI may already be gone.
  }
}

export async function localPhotoExists(uri?: string) {
  if (!uri || uri.startsWith('http') || !canUseLocalFiles()) return false;

  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export function getPhotoUri(uri: string) {
  return uri;
}
