import {
  AREA_USE_LABELS,
  CONTAMINATION_LABELS,
  EXPOSURE_LABELS,
  PROBLEM_LABELS,
} from '@/constants/labels';
import type { AreaUseType, ContaminationType, ExposureType, ProblemType, SurveySector } from '@/types';

export function joinLabels(values: string[]) {
  return values.filter(Boolean).join(', ');
}

export function problemList(sector: SurveySector) {
  if (sector.problems.length === 0) return 'Sin problemas registrados';
  return joinLabels(
    sector.problems.map((id) =>
      id === 'other' && sector.otherProblem ? sector.otherProblem : PROBLEM_LABELS[id as ProblemType] ?? id,
    ),
  );
}

export function useList(values: AreaUseType[], other?: string) {
  if (values.length === 0) return '—';
  return joinLabels(values.map((id) => (id === 'other' && other ? other : AREA_USE_LABELS[id])));
}

export function contaminationList(values: ContaminationType[], none?: boolean, other?: string) {
  if (none) return 'No se observa contaminación relevante';
  if (values.length === 0) return '—';
  return joinLabels(values.map((id) => (id === 'other' && other ? other : CONTAMINATION_LABELS[id])));
}

export function exposureList(values: ExposureType[]) {
  if (values.length === 0) return '—';
  return joinLabels(values.map((id) => EXPOSURE_LABELS[id]));
}
