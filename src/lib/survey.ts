import { WIZARD_STEPS } from '@/constants/labels';
import { usesElements } from '@/constants/options';
import { isUuid } from '@/lib/id';
import { surveyArea } from '@/lib/service';
import type {
  PhotoEvidence,
  PhotoUploadStatus,
  ServiceType,
  Severity,
  SurfaceCondition,
  Survey,
  SurveyElement,
  SurveySector,
} from '@/types';

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const CONDITION_RANK: Record<SurfaceCondition, number> = {
  good: 1,
  regular: 2,
  bad: 3,
  critical: 4,
};

export function nextSurveyCode(surveys: Survey[], year = new Date().getFullYear()) {
  const prefix = `LEV-${year}-`;
  const max = surveys.reduce((current, survey) => {
    const match = survey.code.match(/^LEV-(\d{4})-(\d+)$/);
    if (!match || Number(match[1]) !== year) return current;
    return Math.max(current, Number(match[2]));
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

export function collectElements(survey: Survey): SurveyElement[] {
  return survey.sectors.flatMap((sector) => sector.elements);
}

export function collectPhotos(survey: Survey): PhotoEvidence[] {
  return [
    ...survey.photos,
    ...survey.sectors.flatMap((sector) => [
      ...sector.photos,
      ...sector.elements.flatMap((element) => element.photos),
    ]),
  ];
}

function mapSurveyPhotos(survey: Survey, mapPhoto: (photo: PhotoEvidence) => PhotoEvidence): Survey {
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

export function photoUploadStatus(photo: PhotoEvidence): PhotoUploadStatus {
  if (photo.storagePath || photo.uploadStatus === 'ready') return 'ready';
  if (photo.uploadStatus === 'uploading' || photo.uploadStatus === 'error') return photo.uploadStatus;
  if (!photo.uri || photo.uri.startsWith('http')) return 'ready';
  return 'pending';
}

export function needsPhotoUpload(photo: PhotoEvidence) {
  const status = photoUploadStatus(photo);
  return status === 'pending' || status === 'error';
}

export function patchSurveyPhoto(survey: Survey, photoId: string, patch: Partial<PhotoEvidence>): Survey {
  return mapSurveyPhotos(survey, (photo) => (photo.id === photoId ? { ...photo, ...patch } : photo));
}

function mergePhoto(next: PhotoEvidence, previous?: PhotoEvidence): PhotoEvidence {
  if (!previous) return { ...next, uploadStatus: photoUploadStatus(next) };
  const storagePath = next.storagePath || previous.storagePath;
  const uri = next.uri || previous.uri;
  if (storagePath) {
    return { ...next, storagePath, uri, uploadStatus: 'ready' };
  }
  const uploadStatus: PhotoUploadStatus =
    next.uploadStatus === 'uploading' || (next.uploadStatus == null && previous.uploadStatus === 'uploading')
      ? 'uploading'
      : next.uploadStatus === 'error'
        ? 'error'
        : next.uploadStatus === 'pending'
          ? 'pending'
          : previous.uploadStatus === 'error'
            ? 'error'
            : photoUploadStatus({ ...next, storagePath, uri });
  return { ...next, storagePath, uri, uploadStatus };
}

export function mergeRemotePhotoPaths(next: Survey, existing: Survey): Survey {
  const existingById = new Map(collectPhotos(existing).map((photo) => [photo.id, photo]));
  return mapSurveyPhotos(next, (photo) => mergePhoto(photo, existingById.get(photo.id)));
}

export function applyPersistedSurvey(local: Survey | undefined, persisted: Survey): Survey {
  if (!local) return persisted;
  if (persisted.updatedAt >= local.updatedAt) return mergeRemotePhotoPaths(persisted, local);
  return { ...mergeRemotePhotoPaths(local, persisted), code: persisted.code };
}

export type RemovedSurveyChildren = {
  sectorIds: string[];
  elementIds: string[];
  photos: { id: string; storagePath?: string }[];
};

export const EMPTY_REMOVED_CHILDREN: RemovedSurveyChildren = {
  sectorIds: [],
  elementIds: [],
  photos: [],
};

export function removedSurveyChildren(previous: Survey | undefined, next: Survey): RemovedSurveyChildren {
  if (!previous) return EMPTY_REMOVED_CHILDREN;
  const nextSectors = new Set(next.sectors.map((item) => item.id));
  const nextElements = new Set(collectElements(next).map((item) => item.id));
  const nextPhotos = new Set(collectPhotos(next).map((item) => item.id));
  return {
    sectorIds: previous.sectors.filter((item) => isUuid(item.id) && !nextSectors.has(item.id)).map((item) => item.id),
    elementIds: collectElements(previous)
      .filter((item) => isUuid(item.id) && !nextElements.has(item.id))
      .map((item) => item.id),
    photos: collectPhotos(previous)
      .filter((item) => isUuid(item.id) && !nextPhotos.has(item.id))
      .map((item) => ({ id: item.id, storagePath: item.storagePath })),
  };
}

export function mergeRemovedChildren(current: RemovedSurveyChildren, extra: RemovedSurveyChildren): RemovedSurveyChildren {
  return {
    sectorIds: [...new Set([...current.sectorIds, ...extra.sectorIds])],
    elementIds: [...new Set([...current.elementIds, ...extra.elementIds])],
    photos: [...current.photos, ...extra.photos.filter((photo) => !current.photos.some((item) => item.id === photo.id))],
  };
}

export function hasRemovedChildren(removed: RemovedSurveyChildren) {
  return removed.sectorIds.length > 0 || removed.elementIds.length > 0 || removed.photos.length > 0;
}

export function collectPhotoUris(survey: Survey) {
  return collectPhotos(survey).map((photo) => photo.uri).filter(Boolean);
}

export function photoCount(survey: Survey) {
  return collectPhotos(survey).length;
}

export function elementCount(survey: Survey) {
  return collectElements(survey).length;
}

export function problemCount(survey: Survey) {
  const fromSectors = survey.sectors.reduce((total, sector) => total + sector.problems.length, 0);
  const fromElements = collectElements(survey).reduce((total, element) => total + element.problems.length, 0);
  const fromService = 'problems' in survey.serviceData ? survey.serviceData.problems.length : 0;
  return fromSectors + fromElements || fromService;
}

export function sectorProblemCount(sector: SurveySector) {
  return sector.problems.length + sector.elements.reduce((total, element) => total + element.problems.length, 0);
}

export function surveyNeedsSector(survey: Survey) {
  return survey.scope === 'sectors' || survey.scope === 'critical_points';
}

export function maxSeverity(survey: Survey): Severity | undefined {
  const values = [
    ...survey.sectors.map((sector) => sector.severity),
    ...collectElements(survey).map((element) => element.severity),
  ];
  if (values.length === 0) return undefined;
  return values.reduce((current, item) => (SEVERITY_RANK[item] > SEVERITY_RANK[current] ? item : current));
}

export function maxCondition(survey: Survey): SurfaceCondition | undefined {
  const values = [
    ...(survey.overallCondition ? [survey.overallCondition] : []),
    ...survey.sectors.map((sector) => sector.condition),
    ...collectElements(survey).map((element) => element.condition),
  ];
  if (values.length === 0) return undefined;
  return values.reduce((current, item) => (CONDITION_RANK[item] > CONDITION_RANK[current] ? item : current));
}

export function criticalItemCount(survey: Survey) {
  const sectors = survey.sectors.filter((sector) => sector.severity === 'high' || sector.severity === 'critical').length;
  const elements = collectElements(survey).filter(
    (element) => element.severity === 'high' || element.severity === 'critical',
  ).length;
  return sectors + elements;
}

export function severeCorrosionCount(survey: Survey) {
  return collectElements(survey).filter((element) => element.corrosionLevel === 'severe').length;
}

export function hasBadCondition(survey: Survey) {
  if (survey.overallCondition === 'bad' || survey.overallCondition === 'critical') return true;
  return (
    survey.sectors.some((sector) => sector.condition === 'bad' || sector.condition === 'critical') ||
    collectElements(survey).some((element) => element.condition === 'bad' || element.condition === 'critical')
  );
}

export function hasHighSeverity(survey: Survey) {
  const highest = maxSeverity(survey);
  return highest === 'high' || highest === 'critical';
}

export type HistoryFinding = 'bad' | 'high';

export function surveyMatchesService(survey: Survey, serviceType: ServiceType | 'all') {
  return serviceType === 'all' || survey.serviceType === serviceType;
}

export function surveyMatchesFindings(survey: Survey, findings: HistoryFinding[]) {
  if (findings.includes('bad') && !hasBadCondition(survey)) return false;
  if (findings.includes('high') && !hasHighSeverity(survey)) return false;
  return true;
}

export function surveyProgress(survey: Survey) {
  const total = WIZARD_STEPS.length - 1;
  let done = 1;
  if (survey.scope && survey.overallCondition) done += 1;
  if (!surveyNeedsSector(survey) || survey.sectors.some((sector) => sector.name.trim())) done += 1;
  if (photoCount(survey) > 0) done += 1;
  if (survey.conclusion?.trim() || survey.generalObservations?.trim() || survey.accessNotes?.trim()) done += 1;
  if (survey.status === 'completed') return { done: total, total };
  return { done: Math.min(done, total), total };
}

export function validateConditionFields(survey: Survey) {
  const errors: string[] = [];
  if (!survey.scope) errors.push('Selecciona el alcance de la inspección.');
  if (!survey.overallCondition) errors.push('Selecciona el estado general.');
  if (survey.serviceData.type === 'epoxy' || survey.serviceData.type === 'pu_cement') {
    if (!survey.serviceData.totalArea || survey.serviceData.totalArea <= 0) {
      errors.push('Ingresa la superficie total aproximada en m².');
    }
    if (survey.serviceData.surfaceKind === 'other' && !survey.serviceData.otherSurfaceKind?.trim()) {
      errors.push('Describe la superficie.');
    }
  }
  if (survey.serviceData.type === 'roof_waterproofing') {
    if (!survey.serviceData.roofKind) errors.push('Selecciona el tipo de cubierta.');
    if (!survey.serviceData.totalArea || survey.serviceData.totalArea <= 0) {
      errors.push('Ingresa la superficie total aproximada en m².');
    }
  }
  return errors;
}

export function validateSurveyForComplete(survey: Survey) {
  const errors = validateConditionFields(survey);
  if (!survey.projectId) errors.unshift('Selecciona un proyecto.');
  if (!survey.serviceType) errors.unshift('Selecciona el tipo de servicio.');
  if (surveyNeedsSector(survey) && survey.sectors.filter((sector) => sector.name.trim()).length === 0) {
    errors.push(
      survey.scope === 'critical_points'
        ? 'Registra al menos un punto crítico.'
        : 'Agrega al menos un sector.',
    );
  }
  if (
    survey.serviceType === 'corrosion_control' &&
    surveyNeedsSector(survey) &&
    collectElements(survey).length === 0
  ) {
    errors.push('Registra al menos un elemento inspeccionado.');
  }
  return errors;
}

export function resumeStep(survey: Survey) {
  if (!survey.scope || !survey.overallCondition) return survey.visitReason ? 1 : 0;
  if (surveyNeedsSector(survey) && survey.sectors.length === 0) return 2;
  return 2;
}

export function lastActivityAt(dates: Array<string | undefined>) {
  return dates.filter(Boolean).sort((a, b) => b!.localeCompare(a!))[0];
}

export function cloneSectorFields(sector: SurveySector): Pick<
  SurveySector,
  | 'approximateArea'
  | 'condition'
  | 'severity'
  | 'problems'
  | 'otherProblem'
  | 'uses'
  | 'otherUse'
  | 'trafficLevel'
  | 'exposures'
  | 'observations'
  | 'recommendation'
> {
  return {
    approximateArea: sector.approximateArea,
    condition: sector.condition,
    severity: sector.severity,
    problems: [...sector.problems],
    otherProblem: sector.otherProblem,
    uses: [...sector.uses],
    otherUse: sector.otherUse,
    trafficLevel: sector.trafficLevel,
    exposures: [...sector.exposures],
    observations: sector.observations,
    recommendation: sector.recommendation,
  };
}

export { surveyArea, usesElements };
