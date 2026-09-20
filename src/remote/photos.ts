import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { isUuid } from '@/lib/id';
import { supabase } from '@/lib/supabase';
import { localPhotoExists } from '@/services/photoStorage';
import type { PhotoEvidence } from '@/types';

import { RemoteError, remoteMessage } from './errors';
import { photoToRow } from './mappers';

const BUCKET = 'fotos';
const SIGNED_TTL_SECONDS = 60 * 60 * 24;
const SIGNED_REFRESH_MS = 60 * 60 * 1000;

const signedCache = new Map<string, { url: string; expiresAt: number }>();

export function photoStoragePath(userId: string, surveyId: string, photoId: string) {
  return `${userId}/${surveyId}/${photoId}.jpg`;
}

function contentTypeFor(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

async function readPhotoBody(uri: string) {
  if (Platform.OS !== 'web' && (await localPhotoExists(uri))) {
    return new File(uri).arrayBuffer();
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new RemoteError('No se pudo leer la fotografía para subirla.');
  }
  return response.arrayBuffer();
}

export async function uploadPhoto(userId: string, photo: PhotoEvidence) {
  if (photo.storagePath) return photo.storagePath;
  if (!photo.uri || photo.uri.startsWith('http')) return undefined;

  const path = photoStoragePath(userId, photo.surveyId, photo.id);
  const body = await readPhotoBody(photo.uri);
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: contentTypeFor(photo.uri),
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudo subir la fotografía.'), error);
  return path;
}

export async function upsertPhotoRemote(photo: PhotoEvidence) {
  if (!isUuid(photo.id) || !isUuid(photo.surveyId)) return;
  const { error } = await supabase.from('fotos').upsert(photoToRow(photo), { onConflict: 'id' });
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudo guardar la fotografía.'), error);
}

export async function deleteStoredPhoto(storagePath?: string) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudo borrar la fotografía remota.'), error);
}

export async function signedUrlsFor(paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return new Map<string, string>();

  const now = Date.now();
  const urls = new Map<string, string>();
  const missing: string[] = [];

  for (const path of unique) {
    const cached = signedCache.get(path);
    if (cached && cached.expiresAt - now > SIGNED_REFRESH_MS) {
      urls.set(path, cached.url);
    } else {
      missing.push(path);
    }
  }

  if (missing.length === 0) return urls;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(missing, SIGNED_TTL_SECONDS);
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron firmar las fotografías.'), error);

  const expiresAt = now + SIGNED_TTL_SECONDS * 1000;
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      signedCache.set(item.path, { url: item.signedUrl, expiresAt });
      urls.set(item.path, item.signedUrl);
    }
  }
  return urls;
}

export async function signedUrlFor(path?: string) {
  if (!path) return undefined;
  const urls = await signedUrlsFor([path]);
  return urls.get(path);
}

export function forgetSignedUrl(path?: string) {
  if (path) signedCache.delete(path);
}

export function profilePhotoPath(userId: string) {
  return `${userId}/perfil/avatar.jpg`;
}

export async function uploadProfilePhoto(userId: string, uri: string) {
  const path = profilePhotoPath(userId);
  const body = await readPhotoBody(uri);
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: 'image/jpeg',
    upsert: true,
    cacheControl: '3600',
  });
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudo subir la foto de perfil.'), error);
  forgetSignedUrl(path);
  return path;
}
