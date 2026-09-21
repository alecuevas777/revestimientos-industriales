import { isUuid } from '@/lib/id';
import { supabase } from '@/lib/supabase';
import {
  collectElements,
  collectPhotos,
  hasRemovedChildren,
  type RemovedSurveyChildren,
} from '@/lib/survey';
import type { PhotoEvidence, Survey } from '@/types';

import { ELEMENT_COLUMNS, PHOTO_COLUMNS, SECTOR_COLUMNS, SURVEY_COLUMNS } from './columns';
import { RemoteError, remoteMessage, uniqueOn } from './errors';
import {
  elementFromRow,
  elementToRow,
  photoFromRow,
  photoToRow,
  sectorFromRow,
  sectorToRow,
  surveyFromParts,
  surveyToRow,
  type ElementoRow,
  type FotoRow,
  type LevantamientoRow,
  type SectorRow,
} from './mappers';
import { deleteStoredPhoto } from './photos';

function bumpSurveyCode(code: string) {
  const match = code.match(/^(LEV-\d{4}-)(\d+)$/);
  if (!match) return `${code}-2`;
  const next = Number(match[2]) + 1;
  return `${match[1]}${String(next).padStart(Math.max(match[2].length, 4), '0')}`;
}

function chunk<T>(items: T[], size = 100) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const group = map.get(key(item));
    if (group) group.push(item);
    else map.set(key(item), [item]);
  }
  return map;
}

async function fetchBySurveyIds<T>(table: 'sectores' | 'elementos' | 'fotos', columns: string, surveyIds: string[]) {
  if (surveyIds.length === 0) return [] as T[];
  const rows: T[] = [];
  for (const ids of chunk(surveyIds)) {
    const { data, error } = await supabase.from(table).select(columns).in('levantamiento_id', ids);
    if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron cargar los levantamientos.'), error);
    rows.push(...((data ?? []) as T[]));
  }
  return rows;
}

async function upsertLevantamiento(survey: Survey) {
  let row = surveyToRow(survey);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabase.from('levantamientos').upsert(row, { onConflict: 'id' });
    if (!error) return row.codigo;
    if (!uniqueOn(error, 'codigo')) {
      throw new RemoteError(remoteMessage(error, 'No se pudo guardar el levantamiento.'), error);
    }
    row = { ...row, codigo: bumpSurveyCode(row.codigo) };
  }
  throw new RemoteError('No se pudo asignar un código único al levantamiento.');
}

async function syncPhotos(survey: Survey) {
  const photos = collectPhotos(survey).filter((photo) => isUuid(photo.id));
  if (photos.length > 0) {
    const { error } = await supabase.from('fotos').upsert(photos.map(photoToRow), { onConflict: 'id' });
    if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron guardar las fotografías.'), error);
  }
  return photos;
}

function replacePhotos(survey: Survey, photos: PhotoEvidence[]): Survey {
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  const mapPhoto = (photo: PhotoEvidence) => byId.get(photo.id) ?? photo;
  return {
    ...survey,
    photos: survey.photos.map(mapPhoto),
    sectors: survey.sectors.map((sector) => ({
      ...sector,
      photos: sector.photos.map(mapPhoto),
      elements: sector.elements.map((element) => ({
        ...element,
        photos: element.photos.map(mapPhoto),
      })),
    })),
  };
}

async function deleteKnownChildren(removed: RemovedSurveyChildren) {
  if (!hasRemovedChildren(removed)) return;

  await Promise.all(removed.photos.map((photo) => deleteStoredPhoto(photo.storagePath).catch(() => undefined)));

  if (removed.photos.length > 0) {
    const { error } = await supabase.from('fotos').delete().in('id', removed.photos.map((photo) => photo.id));
    if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron actualizar las fotografías.'), error);
  }
  if (removed.elementIds.length > 0) {
    const { error } = await supabase.from('elementos').delete().in('id', removed.elementIds);
    if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron actualizar los elementos.'), error);
  }
  if (removed.sectorIds.length > 0) {
    const { error } = await supabase.from('sectores').delete().in('id', removed.sectorIds);
    if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron actualizar los sectores.'), error);
  }
}

export async function upsertSurveyRemote(survey: Survey, removed?: RemovedSurveyChildren) {
  const codigo = await upsertLevantamiento(survey);
  const current = { ...survey, code: codigo };

  const sectors = current.sectors.filter((sector) => isUuid(sector.id));
  if (sectors.length > 0) {
    const { error } = await supabase.from('sectores').upsert(sectors.map(sectorToRow), { onConflict: 'id' });
    if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron guardar los sectores.'), error);
  }

  const elements = collectElements(current).filter((element) => isUuid(element.id) && isUuid(element.sectorId));
  if (elements.length > 0) {
    const { error } = await supabase.from('elementos').upsert(elements.map(elementToRow), { onConflict: 'id' });
    if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron guardar los elementos.'), error);
  }

  const photos = await syncPhotos(current);
  const withPhotos = replacePhotos(current, photos);
  if (removed) await deleteKnownChildren(removed);
  return withPhotos;
}

export async function deleteSurveyRemote(survey: Survey) {
  const photos = collectPhotos(survey);
  await Promise.all(photos.map((photo) => deleteStoredPhoto(photo.storagePath).catch(() => undefined)));
  const { error } = await supabase.from('levantamientos').delete().eq('id', survey.id);
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudo eliminar el levantamiento.'), error);
}

function photosFromRows(rows: FotoRow[]) {
  return rows.map((row) => photoFromRow(row, row.uri_local ?? ''));
}

async function hydrateSurveyRows(surveys: LevantamientoRow[]) {
  const surveyIds = surveys.map((row) => row.id);
  const [sectorRows, elementRows, photoRows] = await Promise.all([
    fetchBySurveyIds<SectorRow>('sectores', SECTOR_COLUMNS, surveyIds),
    fetchBySurveyIds<ElementoRow>('elementos', ELEMENT_COLUMNS, surveyIds),
    fetchBySurveyIds<FotoRow>('fotos', PHOTO_COLUMNS, surveyIds),
  ]);
  const photos = photosFromRows(photoRows);

  const photosBySurvey = groupBy(photos, (photo) => photo.surveyId);
  const elementsBySurvey = groupBy(elementRows, (row) => row.levantamiento_id);
  const sectorsBySurvey = groupBy(sectorRows, (row) => row.levantamiento_id);

  return surveys.map((row) => {
    const surveyPhotos = photosBySurvey.get(row.id) ?? [];
    const photosByElement = groupBy(
      surveyPhotos.filter((photo) => photo.elementId),
      (photo) => photo.elementId as string,
    );
    const surveyElements = (elementsBySurvey.get(row.id) ?? []).map((element) =>
      elementFromRow(element, photosByElement.get(element.id) ?? []),
    );
    const elementsBySector = groupBy(surveyElements, (element) => element.sectorId);
    const sectorPhotos = groupBy(
      surveyPhotos.filter((photo) => photo.sectorId && !photo.elementId),
      (photo) => photo.sectorId as string,
    );
    const sectors = (sectorsBySurvey.get(row.id) ?? []).map((sector) =>
      sectorFromRow(sector, elementsBySector.get(sector.id) ?? [], sectorPhotos.get(sector.id) ?? []),
    );
    return surveyFromParts(
      row,
      sectors,
      surveyPhotos.filter((photo) => !photo.sectorId && !photo.elementId),
    );
  });
}

export async function listSurveysForUser(userId: string) {
  const { data, error } = await supabase
    .from('levantamientos')
    .select(SURVEY_COLUMNS)
    .eq('usuario_id', userId)
    .order('actualizado_en', { ascending: false });
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron cargar los levantamientos.'), error);
  return hydrateSurveyRows((data ?? []) as LevantamientoRow[]);
}

export async function listCompletedSurveys() {
  const { data, error } = await supabase
    .from('levantamientos')
    .select(SURVEY_COLUMNS)
    .eq('estado', 'completed')
    .order('finalizado_en', { ascending: false });
  if (error) {
    const text = error.message.toLowerCase();
    if (text.includes('row-level security') || text.includes('permission denied')) {
      throw new RemoteError(
        'Falta aplicar en Supabase la migración de Equipo VICAST. SQL Editor → pega supabase/migrations/20260920223000_team_library.sql y Run.',
      );
    }
    throw new RemoteError(remoteMessage(error, 'No se pudieron cargar los levantamientos del equipo.'), error);
  }
  try {
    return await hydrateSurveyRows((data ?? []) as LevantamientoRow[]);
  } catch {
    return ((data ?? []) as LevantamientoRow[]).map((row) => surveyFromParts(row, [], []));
  }
}

export async function getSurveyById(id: string) {
  const { data, error } = await supabase.from('levantamientos').select(SURVEY_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudo cargar el levantamiento.'), error);
  if (!data) return null;
  const [survey] = await hydrateSurveyRows([data as LevantamientoRow]);
  return survey ?? null;
}
