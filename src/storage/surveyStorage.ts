import { STORAGE_KEYS } from '@/constants/storageKeys';
import { createId } from '@/lib/id';
import { collectPhotoUris, nextSurveyCode } from '@/lib/survey';
import type { Survey, SurveySector } from '@/types';

import { readJson, writeJson } from './json';
import { deleteLocalPhoto } from '@/services/photoStorage';

function normalizeSector(sector: SurveySector): SurveySector {
  return {
    ...sector,
    problems: sector.problems ?? [],
    contaminations: sector.contaminations ?? [],
    uses: sector.uses ?? [],
    exposures: sector.exposures ?? [],
    photos: sector.photos ?? [],
  };
}

function normalizeSurvey(survey: Survey): Survey {
  return {
    ...survey,
    contaminations: survey.contaminations ?? [],
    uses: survey.uses ?? [],
    exposures: survey.exposures ?? [],
    photos: survey.photos ?? [],
    sectors: (survey.sectors ?? []).map(normalizeSector),
  };
}

export async function getSurveys() {
  const surveys = await readJson<Survey[]>(STORAGE_KEYS.surveys, []);
  return surveys.map(normalizeSurvey);
}

export async function saveSurveys(surveys: Survey[]) {
  await writeJson(STORAGE_KEYS.surveys, surveys);
}

export async function createSurvey(input: Omit<Survey, 'id' | 'code'> & { code?: string }) {
  const surveys = await getSurveys();
  const now = new Date().toISOString();
  const survey: Survey = {
    ...input,
    id: createId('srv'),
    code: input.code ?? nextSurveyCode(surveys),
    startedAt: input.startedAt ?? now,
    updatedAt: now,
    sectors: input.sectors ?? [],
    photos: input.photos ?? [],
  };
  await saveSurveys([survey, ...surveys]);
  return survey;
}

export async function upsertSurvey(survey: Survey) {
  const surveys = await getSurveys();
  const next = { ...survey, updatedAt: new Date().toISOString() };
  const index = surveys.findIndex((item) => item.id === survey.id);
  const list = index >= 0 ? surveys.map((item) => (item.id === survey.id ? next : item)) : [next, ...surveys];
  await saveSurveys(list);
  return next;
}

export async function deleteSurvey(id: string) {
  const surveys = await getSurveys();
  const survey = surveys.find((item) => item.id === id);
  if (survey) {
    await Promise.all(collectPhotoUris(survey).map((uri) => deleteLocalPhoto(uri)));
  }
  await saveSurveys(surveys.filter((item) => item.id !== id));
}

export function emptySector(surveyId: string): SurveySector {
  const now = new Date().toISOString();
  return {
    id: createId('sec'),
    surveyId,
    name: '',
    condition: 'regular',
    severity: 'medium',
    problems: [],
    contaminations: [],
    uses: [],
    exposures: [],
    photos: [],
    createdAt: now,
    updatedAt: now,
  };
}
