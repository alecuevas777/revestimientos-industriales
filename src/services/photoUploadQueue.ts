import { AppState } from 'react-native';

import { collectPhotos, needsPhotoUpload } from '@/lib/survey';
import { upsertPhotoRemote, uploadPhoto } from '@/remote/photos';
import type { PhotoEvidence, PhotoUploadStatus, Survey } from '@/types';

type Binder = {
  getUserId: () => string | undefined;
  getPhoto: (surveyId: string, photoId: string) => PhotoEvidence | undefined;
  onPatch: (surveyId: string, photoId: string, patch: Partial<PhotoEvidence>) => void;
  ensureRemote: (surveyId: string) => Promise<void>;
};

type UploadInfo = { status: PhotoUploadStatus; storagePath?: string };

const pending: { surveyId: string; photoId: string }[] = [];
const queued = new Set<string>();
const attempts = new Map<string, number>();
const statuses = new Map<string, UploadInfo>();
const listeners = new Set<() => void>();
let snapshot: ReadonlyMap<string, UploadInfo> = new Map();
let binder: Binder | null = null;
let draining = false;

const MAX_ATTEMPTS = 5;

function emitUploads() {
  snapshot = new Map(statuses);
  listeners.forEach((listener) => listener());
}

function setUpload(photoId: string, info: UploadInfo) {
  statuses.set(photoId, info);
  emitUploads();
}

export function subscribePhotoUploads(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function getPhotoUploadSnapshot() {
  return snapshot;
}

export function bindPhotoUploader(next: Binder) {
  binder = next;
}

export function resetPhotoUploadQueue() {
  pending.length = 0;
  queued.clear();
  attempts.clear();
  statuses.clear();
  emitUploads();
}

export function cancelPhotoUpload(photoId: string) {
  queued.delete(photoId);
  attempts.delete(photoId);
  statuses.delete(photoId);
  emitUploads();
  const index = pending.findIndex((job) => job.photoId === photoId);
  if (index >= 0) pending.splice(index, 1);
}

export function enqueuePhotoUpload(surveyId: string, photoId: string) {
  if (queued.has(photoId)) return;
  queued.add(photoId);
  pending.push({ surveyId, photoId });
  if (statuses.get(photoId)?.status !== 'ready') {
    setUpload(photoId, { status: 'uploading', storagePath: statuses.get(photoId)?.storagePath });
  }
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

  let storagePath = initial.storagePath ?? statuses.get(job.photoId)?.storagePath;

  if (!storagePath && initial.uri && !initial.uri.startsWith('http')) {
    setUpload(job.photoId, { status: 'uploading' });
    binder.onPatch(job.surveyId, job.photoId, { uploadStatus: 'uploading' });
    try {
      const userId = binder.getUserId();
      if (!userId) throw new Error('Sin sesión');
      storagePath = await uploadPhoto(userId, initial);
      if (!storagePath) throw new Error('Sin ruta de storage');
    } catch {
      setUpload(job.photoId, { status: 'error' });
      binder.onPatch(job.surveyId, job.photoId, { uploadStatus: 'error' });
      retry(job);
      return;
    }
  }

  if (storagePath) {
    setUpload(job.photoId, { status: 'ready', storagePath });
    binder.onPatch(job.surveyId, job.photoId, { storagePath, uploadStatus: 'ready' });
  }

  const latest = binder.getPhoto(job.surveyId, job.photoId) ?? initial;
  try {
    await binder.ensureRemote(job.surveyId);
    await upsertPhotoRemote(withDefaults(latest, { storagePath, uploadStatus: storagePath ? 'ready' : latest.uploadStatus }));
    attempts.delete(job.photoId);
  } catch {
    if (storagePath) attempts.delete(job.photoId);
    else retry(job);
  }
}

AppState.addEventListener('change', (state) => {
  if (state === 'active') void drain();
});
