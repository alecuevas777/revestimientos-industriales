import type { ServiceSpecificData, ServiceType, Survey } from '@/types';

export function emptyServiceData(type: ServiceType): ServiceSpecificData {
  if (type === 'roof_waterproofing') {
    return { type, problems: [] };
  }
  if (type === 'corrosion_control') {
    return { type, exposures: [] };
  }
  return {
    type,
    problems: [],
    uses: [],
    exposures: [],
  };
}

export function surveyArea(survey: Survey) {
  return survey.serviceData.type === 'corrosion_control' ? undefined : survey.serviceData.totalArea;
}

export function patchServiceData(survey: Survey, patch: Partial<ServiceSpecificData>): ServiceSpecificData {
  return { ...survey.serviceData, ...patch, type: survey.serviceData.type } as ServiceSpecificData;
}
