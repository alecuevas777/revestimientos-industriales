import { WIZARD_STEPS } from '@/constants/labels';
import { isFloorService, usesElements } from '@/constants/options';
import { surveyArea } from '@/lib/service';
import type { PhotoEvidence, Severity, Survey, SurveyElement, SurveySector } from '@/types';

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
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
  if (isFloorService(survey.serviceType) && survey.serviceData.type !== 'corrosion_control') {
    if (!survey.serviceData.totalArea || survey.serviceData.totalArea <= 0) {
      errors.push('Ingresa la superficie aproximada en m².');
    }
  }
  if (survey.serviceData.type === 'roof_waterproofing') {
    if (!survey.serviceData.roofKind) errors.push('Selecciona el tipo de cubierta.');
    if (!survey.serviceData.totalArea || survey.serviceData.totalArea <= 0) {
      errors.push('Ingresa la superficie aproximada en m².');
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
