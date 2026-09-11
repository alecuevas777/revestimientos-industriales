import { WIZARD_STEPS } from '@/constants/labels';
import type { PhotoEvidence, Severity, Survey, SurveySector } from '@/types';

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

export function collectPhotos(survey: Survey): PhotoEvidence[] {
  return [...survey.photos, ...survey.sectors.flatMap((sector) => sector.photos)];
}

export function collectPhotoUris(survey: Survey) {
  return collectPhotos(survey).map((photo) => photo.uri).filter(Boolean);
}

export function photoCount(survey: Survey) {
  return collectPhotos(survey).length;
}

export function problemCount(survey: Survey) {
  const sectorProblems = survey.sectors.reduce((total, sector) => total + sector.problems.length, 0);
  return sectorProblems || 0;
}

export function sectorProblemCount(sector: SurveySector) {
  return sector.problems.length;
}

export function surveyNeedsSector(survey: Survey) {
  return survey.scope === 'sectors' || survey.scope === 'critical_points';
}

export function maxSeverity(survey: Survey): Severity | undefined {
  if (survey.sectors.length === 0) return undefined;
  return survey.sectors.reduce<Severity>((current, sector) => {
    return SEVERITY_RANK[sector.severity] > SEVERITY_RANK[current] ? sector.severity : current;
  }, survey.sectors[0].severity);
}

export function criticalSectorCount(survey: Survey) {
  return survey.sectors.filter((sector) => sector.severity === 'high' || sector.severity === 'critical').length;
}

export function hasBadCondition(survey: Survey) {
  if (survey.overallCondition === 'bad' || survey.overallCondition === 'critical') return true;
  return survey.sectors.some((sector) => sector.condition === 'bad' || sector.condition === 'critical');
}

export function hasHighSeverity(survey: Survey) {
  const highest = maxSeverity(survey);
  return highest === 'high' || highest === 'critical';
}

export function surveyProgress(survey: Survey) {
  const total = WIZARD_STEPS.length - 1;
  let done = 1;
  if (survey.surfaceType && survey.totalArea && survey.scope) done += 1;
  if (survey.overallCondition) done += 1;
  if (!surveyNeedsSector(survey) || survey.sectors.some((sector) => sector.name.trim())) done += 1;
  if (photoCount(survey) > 0) done += 1;
  if (survey.conclusion?.trim() || survey.generalObservations?.trim() || survey.accessNotes?.trim()) done += 1;
  if (survey.status === 'completed') return { done: total, total };
  return { done: Math.min(done, total), total };
}

export function surveyProgressPercent(survey: Survey) {
  const { done, total } = surveyProgress(survey);
  return Math.round((done / total) * 100);
}

export function validateSurfaceFields(survey: Survey) {
  const errors: string[] = [];
  if (!survey.surfaceType) errors.push('Selecciona el tipo de superficie.');
  if (!survey.totalArea || survey.totalArea <= 0) errors.push('Ingresa la superficie aproximada en m².');
  if (!survey.scope) errors.push('Selecciona el alcance de la inspección.');
  return errors;
}

export function validateConditionFields(survey: Survey) {
  const errors: string[] = [];
  if (!survey.overallCondition) errors.push('Selecciona el estado general.');
  return errors;
}

export function validateSurveyForComplete(survey: Survey) {
  const errors = [...validateSurfaceFields(survey), ...validateConditionFields(survey)];
  if (!survey.projectId) errors.unshift('Selecciona un proyecto.');
  if (surveyNeedsSector(survey) && survey.sectors.filter((sector) => sector.name.trim()).length === 0) {
    errors.push(
      survey.scope === 'critical_points'
        ? 'Registra al menos un punto crítico.'
        : 'Agrega al menos un sector.',
    );
  }
  return errors;
}

export function resumeStep(survey: Survey) {
  if (!survey.surfaceType || !survey.totalArea || !survey.scope) {
    return survey.visitReason ? 1 : 0;
  }
  if (!survey.overallCondition) return 2;
  if (surveyNeedsSector(survey) && survey.sectors.length === 0) return 3;
  return 3;
}

export function lastActivityAt(dates: Array<string | undefined>) {
  return dates.filter(Boolean).sort((a, b) => b!.localeCompare(a!))[0];
}

export function emptyMoisture() {
  return {};
}

export function cloneSectorFields(sector: SurveySector): Pick<
  SurveySector,
  | 'approximateArea'
  | 'condition'
  | 'severity'
  | 'problems'
  | 'otherProblem'
  | 'moisture'
  | 'contaminations'
  | 'noRelevantContamination'
  | 'otherContamination'
  | 'joints'
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
    moisture: sector.moisture ? { ...sector.moisture } : undefined,
    contaminations: [...sector.contaminations],
    noRelevantContamination: sector.noRelevantContamination,
    otherContamination: sector.otherContamination,
    joints: sector.joints ? { ...sector.joints } : undefined,
    uses: [...sector.uses],
    otherUse: sector.otherUse,
    trafficLevel: sector.trafficLevel,
    exposures: [...sector.exposures],
    observations: sector.observations,
    recommendation: sector.recommendation,
  };
}
