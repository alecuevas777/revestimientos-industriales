import {
  AREA_USE_LABELS,
  COATING_CONDITION_LABELS,
  CORROSION_ELEMENT_LABELS,
  CORROSION_LEVEL_LABELS,
  ELEMENT_TYPE_LABELS,
  EXISTING_COATING_LABELS,
  EXPOSURE_LABELS,
  FLOOR_SUBSTRATE_LABELS,
  FLOOR_SURFACE_LABELS,
  MATERIAL_LABELS,
  OPERATING_TEMP_LABELS,
  PHOTO_CATEGORY_LABELS,
  PROBLEM_LABELS,
  PROTECTION_LABELS,
  TRAFFIC_LABELS,
  ROOF_ELEMENT_LABELS,
  ROOF_KIND_LABELS,
  YES_NO_LABELS,
  YES_NO_UNKNOWN_LABELS,
} from '@/constants/labels';
import type {
  AreaUseType,
  CoatingCondition,
  CorrosionElementType,
  CorrosionLevel,
  CorrosionProblemType,
  ElementType,
  ExistingCoatingType,
  ExposureType,
  FloorProblemType,
  FloorSubstrate,
  FloorSurfaceKind,
  MetalMaterial,
  OperatingTemp,
  PhotoCategory,
  ProblemType,
  ProtectionType,
  RoofElementType,
  RoofKind,
  RoofProblemType,
  ServiceType,
  TrafficLevel,
  YesNo,
  YesNoUnknown,
} from '@/types';

export type Choice<T extends string> = { value: T; label: string };

function choices<T extends string>(ids: readonly T[], labels: Record<T, string>): Choice<T>[] {
  return ids.map((value) => ({ value, label: labels[value] }));
}

export const FLOOR_SURFACES: FloorSurfaceKind[] = ['floor', 'baseboard', 'channel', 'other'];
export const EPOXY_SUBSTRATES: FloorSubstrate[] = ['concrete', 'mortar', 'ceramic', 'existing_coating', 'other'];
export const PU_SUBSTRATES: FloorSubstrate[] = ['concrete', 'mortar', 'existing_coating', 'other'];

export const FLOOR_PROBLEMS: FloorProblemType[] = [
  'cracks',
  'moisture',
  'wear',
  'detachment',
  'unevenness',
  'porosity',
  'damaged_joints',
  'oil_grease',
  'chemical_contamination',
  'impacts',
  'deteriorated_coating',
  'other',
];

export const ROOF_PROBLEMS: RoofProblemType[] = [
  'leaks',
  'moisture',
  'corrosion',
  'perforations',
  'damaged_seals',
  'cracks',
  'membrane_detached',
  'damaged_overlaps',
  'damaged_fasteners',
  'water_ponding',
  'deformations',
  'other',
];

export const CORROSION_PROBLEMS: CorrosionProblemType[] = [
  'surface_rust',
  'general_corrosion',
  'localized_corrosion',
  'coating_detached',
  'blistered_paint',
  'flaking_paint',
  'exposed_metal',
  'permanent_moisture',
  'chemical_attack',
  'joint_corrosion',
  'weld_corrosion',
  'other',
];

export const FLOOR_USES: AreaUseType[] = [
  'pedestrian',
  'pallet_jacks',
  'forklift',
  'vehicles',
  'machinery',
  'production',
  'warehouse',
  'dispatch',
  'other',
];

export const EPOXY_EXPOSURES: ExposureType[] = [
  'water',
  'oils',
  'greases',
  'chemicals',
  'abrasion',
  'impacts',
  'moisture',
  'other',
];

export const PU_EXPOSURES: ExposureType[] = [
  'frequent_wash',
  'pressure_wash',
  'hot_water',
  'chemicals',
  'greases',
  'oils',
  'severe_abrasion',
  'impacts',
  'permanent_moisture',
  'thermal_shock',
];

export const CORROSION_EXPOSURES: ExposureType[] = [
  'dry_interior',
  'exterior',
  'frequent_moisture',
  'marine',
  'water',
  'chemicals',
  'industrial',
  'high_temp',
  'condensation',
  'other',
];

export const ROOF_ELEMENTS: RoofElementType[] = [
  'gutter',
  'downspout',
  'overlap',
  'seal',
  'fastener',
  'junction',
  'skylight',
  'penetration',
  'edge',
  'ridge',
  'other',
];

export const CORROSION_ELEMENTS: CorrosionElementType[] = [
  'steel_structure',
  'beam',
  'column',
  'walkway',
  'platform',
  'stair',
  'railing',
  'pipe',
  'tank',
  'support',
  'equipment',
  'other',
];

export const FLOOR_PHOTO_CATEGORIES: PhotoCategory[] = [
  'overview',
  'crack',
  'joint',
  'moisture',
  'detachment',
  'contamination',
  'other',
];

export const ROOF_PHOTO_CATEGORIES: PhotoCategory[] = [
  'overview',
  'leak',
  'corrosion',
  'seal',
  'overlap',
  'gutter',
  'perforation',
  'other',
];

export const CORROSION_PHOTO_CATEGORIES: PhotoCategory[] = [
  'overview',
  'corrosion',
  'coating',
  'joint',
  'weld',
  'detail',
  'other',
];

export const YES_NO_OPTIONS = choices<YesNo>(['yes', 'no'], YES_NO_LABELS);
export const YES_NO_UNKNOWN_OPTIONS = choices<YesNoUnknown>(['yes', 'no', 'unknown'], YES_NO_UNKNOWN_LABELS);
export const FLOOR_SURFACE_OPTIONS = choices(FLOOR_SURFACES, FLOOR_SURFACE_LABELS);
export const EPOXY_SUBSTRATE_OPTIONS = choices(EPOXY_SUBSTRATES, FLOOR_SUBSTRATE_LABELS);
export const PU_SUBSTRATE_OPTIONS = choices(PU_SUBSTRATES, FLOOR_SUBSTRATE_LABELS);
export const ROOF_KIND_OPTIONS = choices<RoofKind>(
  ['metal', 'concrete', 'membrane', 'fiber_cement', 'panel', 'other'],
  ROOF_KIND_LABELS,
);
export const EXISTING_COATING_OPTIONS = choices<ExistingCoatingType>(
  ['epoxy', 'polyurethane', 'pu_cement', 'paint', 'other'],
  EXISTING_COATING_LABELS,
);
export const COATING_CONDITION_OPTIONS = choices<CoatingCondition>(
  ['good', 'worn', 'deteriorated', 'detached', 'very_deteriorated', 'unknown'],
  COATING_CONDITION_LABELS,
);
export const FLOOR_PROBLEM_OPTIONS = choices(FLOOR_PROBLEMS, PROBLEM_LABELS);
export const ROOF_PROBLEM_OPTIONS = choices(ROOF_PROBLEMS, PROBLEM_LABELS);
export const CORROSION_PROBLEM_OPTIONS = choices(CORROSION_PROBLEMS, PROBLEM_LABELS);
export const AREA_USE_OPTIONS = choices(FLOOR_USES, AREA_USE_LABELS);
export const TRAFFIC_OPTIONS = choices<TrafficLevel>(['low', 'medium', 'high'], TRAFFIC_LABELS);
export const EPOXY_EXPOSURE_OPTIONS = choices(EPOXY_EXPOSURES, EXPOSURE_LABELS);
export const PU_EXPOSURE_OPTIONS = choices(PU_EXPOSURES, EXPOSURE_LABELS);
export const CORROSION_EXPOSURE_OPTIONS = choices(CORROSION_EXPOSURES, EXPOSURE_LABELS);
export const OPERATING_TEMP_OPTIONS = choices<OperatingTemp>(
  ['ambient', 'refrigerated', 'high', 'variable', 'unknown'],
  OPERATING_TEMP_LABELS,
);
export const CORROSION_LEVEL_OPTIONS = choices<CorrosionLevel>(
  ['none', 'slight', 'moderate', 'severe', 'undetermined'],
  CORROSION_LEVEL_LABELS,
);
export const MATERIAL_OPTIONS = choices<MetalMaterial>(
  ['carbon_steel', 'galvanized', 'stainless', 'aluminum', 'other', 'unknown'],
  MATERIAL_LABELS,
);
export const PROTECTION_OPTIONS = choices<ProtectionType>(
  ['paint', 'anticorrosive', 'galvanized', 'other', 'unknown'],
  PROTECTION_LABELS,
);
export const ROOF_ELEMENT_OPTIONS = choices(ROOF_ELEMENTS, ROOF_ELEMENT_LABELS);
export const CORROSION_ELEMENT_OPTIONS = choices(CORROSION_ELEMENTS, CORROSION_ELEMENT_LABELS);

export function isFloorService(type?: ServiceType) {
  return type === 'epoxy' || type === 'pu_cement';
}

export function usesElements(type?: ServiceType) {
  return type === 'roof_waterproofing' || type === 'corrosion_control';
}

export function problemsForService(type?: ServiceType) {
  if (type === 'roof_waterproofing') return ROOF_PROBLEM_OPTIONS;
  if (type === 'corrosion_control') return CORROSION_PROBLEM_OPTIONS;
  return FLOOR_PROBLEM_OPTIONS;
}

export function exposuresForService(type?: ServiceType) {
  if (type === 'pu_cement') return PU_EXPOSURE_OPTIONS;
  if (type === 'corrosion_control') return CORROSION_EXPOSURE_OPTIONS;
  if (type === 'roof_waterproofing') return EPOXY_EXPOSURE_OPTIONS;
  return EPOXY_EXPOSURE_OPTIONS;
}

export function photoCategoriesForService(type?: ServiceType) {
  const ids =
    type === 'roof_waterproofing'
      ? ROOF_PHOTO_CATEGORIES
      : type === 'corrosion_control'
        ? CORROSION_PHOTO_CATEGORIES
        : FLOOR_PHOTO_CATEGORIES;
  return choices(ids, PHOTO_CATEGORY_LABELS);
}

export function elementsForService(type?: ServiceType) {
  if (type === 'roof_waterproofing') return ROOF_ELEMENT_OPTIONS;
  return CORROSION_ELEMENT_OPTIONS;
}

export function elementLabel(id: string) {
  return ELEMENT_TYPE_LABELS[id as ElementType] ?? id;
}

export function problemLabel(id: string) {
  return PROBLEM_LABELS[id as ProblemType] ?? id;
}

export function problemsForSurface(type?: 'floor' | 'roof') {
  return type === 'roof' ? ROOF_PROBLEM_OPTIONS : FLOOR_PROBLEM_OPTIONS;
}
