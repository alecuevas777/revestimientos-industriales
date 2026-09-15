import {
  AREA_USE_LABELS,
  CORROSION_LEVEL_LABELS,
  ELEMENT_TYPE_LABELS,
  EXPOSURE_LABELS,
  FLOOR_SUBSTRATE_LABELS,
  FLOOR_SURFACE_LABELS,
  PROBLEM_LABELS,
  ROOF_KIND_LABELS,
  SERVICE_TYPE_LABELS,
} from '@/constants/labels';
import { isFloorService } from '@/constants/options';
import { elementCount, photoCount, problemCount, severeCorrosionCount, surveyArea } from '@/lib/survey';
import type { AreaUseType, ExposureType, ProblemType, Survey, SurveyElement, SurveySector } from '@/types';

export function joinLabels(values: string[]) {
  return values.filter(Boolean).join(', ');
}

export function problemList(items: ProblemType[], other?: string) {
  if (items.length === 0) return 'Sin problemas registrados';
  return joinLabels(items.map((id) => (id === 'other' && other ? other : PROBLEM_LABELS[id] ?? id)));
}

export function sectorProblemList(sector: SurveySector) {
  return problemList(sector.problems, sector.otherProblem);
}

export function useList(values: AreaUseType[], other?: string) {
  if (values.length === 0) return '—';
  return joinLabels(values.map((id) => (id === 'other' && other ? other : AREA_USE_LABELS[id])));
}

export function exposureList(values: ExposureType[]) {
  if (values.length === 0) return '—';
  return joinLabels(values.map((id) => EXPOSURE_LABELS[id]));
}

export function elementTitle(element: SurveyElement) {
  const type = ELEMENT_TYPE_LABELS[element.elementType];
  return element.reference ? `${type} ${element.reference}` : type;
}

export function surveyHeadline(survey: Survey) {
  const data = survey.serviceData;
  if (data.type === 'corrosion_control') {
    const elements = elementCount(survey);
    const severe = severeCorrosionCount(survey);
    return [
      SERVICE_TYPE_LABELS[survey.serviceType],
      `${elements} ${elements === 1 ? 'elemento' : 'elementos'}`,
      severe ? `${severe} con corrosión severa` : null,
      `${photoCount(survey)} fotos`,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  if (data.type === 'roof_waterproofing') {
    return [
      SERVICE_TYPE_LABELS[survey.serviceType],
      data.roofKind ? ROOF_KIND_LABELS[data.roofKind] : null,
      data.totalArea ? `${data.totalArea.toLocaleString('es-CL')} m²` : null,
      `${photoCount(survey)} fotos`,
    ]
      .filter(Boolean)
      .join(' · ');
  }
  return [
    SERVICE_TYPE_LABELS[survey.serviceType],
    data.surfaceKind ? FLOOR_SURFACE_LABELS[data.surfaceKind] : null,
    data.substrate ? FLOOR_SUBSTRATE_LABELS[data.substrate] : null,
    data.totalArea ? `${data.totalArea.toLocaleString('es-CL')} m²` : null,
    `${survey.sectors.length} ${survey.sectors.length === 1 ? 'sector' : 'sectores'}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function surveyMetrics(survey: Survey) {
  const area = surveyArea(survey);
  return {
    service: SERVICE_TYPE_LABELS[survey.serviceType],
    area,
    sectors: survey.sectors.length,
    elements: elementCount(survey),
    problems: problemCount(survey),
    photos: photoCount(survey),
    severe: severeCorrosionCount(survey),
    floor: isFloorService(survey.serviceType),
  };
}
