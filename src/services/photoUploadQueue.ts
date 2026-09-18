import { AppState } from 'react-native';

import { collectPhotos, needsPhotoUpload } from '@/lib/survey';
import { upsertPhotoRemote, uploadPhoto } from '@/remote/photos';
import type { PhotoEvidence, Survey } from '@/types';

type Binder = {
  getUserId: () => string | undefined;
  getPhoto: (surveyId: string, photoId: string) => PhotoEvidence | undefined;
  onPatch: (surveyId: string, photoId: string, patch: Partial<PhotoEvidence>) => void;
};

const pending: { surveyId: string; photoId: string }[] = [];
const queued = new Set<string>();
let binder: Binder | null = null;
let draining = false;

export function bindPhotoUploader(next: Binder) {
  binder = next;
}

export function resetPhotoUploadQueue() {
  pending.length = 0;
  queued.clear();
}

export function cancelPhotoUpload(photoId: string) {
  queued.delete(photoId);
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

async function process(job: { surveyId: string; photoId: string }) {
  if (!binder) return;
  const photo = binder.getPhoto(job.surveyId, job.photoId);
  if (!photo || photo.storagePath) return;
  if (!photo.uri || photo.uri.startsWith('http')) return;

  binder.onPatch(job.surveyId, job.photoId, { uploadStatus: 'uploading' });
  try {
    const userId = binder.getUserId();
    if (!userId) throw new Error('Sin sesión');
    const storagePath = await uploadPhoto(userId, photo);
    if (!storagePath) {
      binder.onPatch(job.surveyId, job.photoId, { uploadStatus: 'error' });
      return;
    }
    const uploaded = { ...photo, storagePath, uploadStatus: 'ready' as const };
    binder.onPatch(job.surveyId, job.photoId, { storagePath, uploadStatus: 'ready' });
    await upsertPhotoRemote(uploaded).catch(() => undefined);
  } catch {
    binder.onPatch(job.surveyId, job.photoId, { uploadStatus: 'error' });
  }
}

AppState.addEventListener('change', (state) => {
  if (state === 'active') void drain();
});
