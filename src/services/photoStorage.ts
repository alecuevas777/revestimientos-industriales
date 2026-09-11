import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { createId } from '@/lib/id';

function photosDirectory() {
  return new Directory(Paths.document, 'survey-photos');
}

function canUseLocalFiles() {
  return Platform.OS !== 'web' && Boolean(Paths.document);
}

export async function savePhotoLocally(sourceUri: string) {
  if (!canUseLocalFiles() || sourceUri.startsWith('http')) {
    return sourceUri;
  }

  try {
    const directory = photosDirectory();
    if (!directory.exists) {
      directory.create();
    }

    const destination = new File(directory, `${createId('pho')}.jpg`);
    new File(sourceUri).copy(destination);
    return destination.uri;
  } catch {
    return sourceUri;
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

export function getPhotoUri(uri: string) {
  return uri;
}
