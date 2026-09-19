import { AppState } from 'react-native';

import { collectPhotos, needsPhotoUpload } from '@/lib/survey';
import { upsertPhotoRemote, uploadPhoto } from '@/remote/photos';
import type { PhotoEvidence, Survey } from '@/types';

type Binder = {
  getUserId: () => string | undefined;
  getPhoto: (surveyId: string, photoId: string) => PhotoEvidence | undefined;
  onPatch: (surveyId: string, photoId: string, patch: Partial<PhotoEvidence>) => void;
  ensureRemote: (surveyId: string) => Promise<void>;
};

const pending: { surveyId: string; photoId: string }[] = [];
const queued = new Set<string>();
const attempts = new Map<string, number>();
let binder: Binder | null = null;
let draining = false;

const MAX_ATTEMPTS = 5;

export function bindPhotoUploader(next: Binder) {
  binder = next;
}

export function resetPhotoUploadQueue() {
  pending.length = 0;
  queued.clear();
  attempts.clear();
}

export function cancelPhotoUpload(photoId: string) {
  queued.delete(photoId);
  attempts.delete(photoId);
  const index = pending.findIndex((job) => job.photoId === photoId);
  if (index >= 0) pending.splice(index, 1);
}

export function enqueuePhotoUpload(surveyId: string, photoId: string) {
  if (queued.has(photoId)) return;
  queued.add(photoId);
  pending.push({ surveyId, photoId });
  void drain();
}

export function enqueuePendingPhotos(surveys: Survey[]) {
  for (const survey of surveys) {
    for (const photo of collectPhotos(survey)) {
      if (needsPhotoUpload(photo)) enqueuePhotoUpload(survey.id, photo.id);
    }
  }
}

async function drain() {
  if (draining) return;
  draining = true;
  try {
    while (pending.length > 0) {
      const job = pending.shift();
      if (!job) break;
      try {
        await process(job);
      } finally {
        queued.delete(job.photoId);
      }
    }
  } finally {
    draining = false;
    if (pending.length > 0) void drain();
  }
}

function retry(job: { surveyId: string; photoId: string }) {
  const count = (attempts.get(job.photoId) ?? 0) + 1;
  if (count > MAX_ATTEMPTS) return;
  attempts.set(job.photoId, count);
  setTimeout(() => enqueuePhotoUpload(job.surveyId, job.photoId), 1200 * count);
}

function withDefaults(photo: PhotoEvidence, extra?: Partial<PhotoEvidence>): PhotoEvidence {
  return {
    ...photo,
    ...extra,
    category: extra?.category ?? photo.category ?? 'overview',
    caption: extra?.caption ?? photo.caption,
  };
}

async function process(job: { surveyId: string; photoId: string }) {
  if (!binder) {
    retry(job);
    return;
  }

  const initial = binder.getPhoto(job.surveyId, job.photoId);
  if (!initial) {
    retry(job);
    return;
  }
  if (!initial.uri || initial.uri.startsWith('http')) {
    if (initial.storagePath) {
      await upsertPhotoRemote(withDefaults(initial)).catch(() => retry(job));
    }
    return;
  }

  const remoteReady = binder.ensureRemote(job.surveyId).catch(() => undefined);
  let storagePath = initial.storagePath;

  if (!storagePath) {
    binder.onPatch(job.surveyId, job.photoId, { uploadStatus: 'uploading' });
    try {
      const userId = binder.getUserId();
      if (!userId) throw new Error('Sin sesión');
      storagePath = await uploadPhoto(userId, initial);
      if (!storagePath) throw new Error('Sin ruta de storage');
      binder.onPatch(job.surveyId, job.photoId, { storagePath, uploadStatus: 'ready' });
    } catch {
      binder.onPatch(job.surveyId, job.photoId, { uploadStatus: 'error' });
      retry(job);
      return;
    }
  }

  await remoteReady;
  const latest = binder.getPhoto(job.surveyId, job.photoId) ?? initial;
  try {
    await upsertPhotoRemote(withDefaults(latest, { storagePath, uploadStatus: 'ready' }));
    attempts.delete(job.photoId);
  } catch {
    retry(job);
  }
}

AppState.addEventListener('change', (state) => {
  if (state === 'active') void drain();
});
