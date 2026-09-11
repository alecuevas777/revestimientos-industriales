import {
  AREA_USE_LABELS,
  COATING_CONDITION_LABELS,
  CONTAMINATION_LABELS,
  EXISTING_COATING_LABELS,
  EXPOSURE_LABELS,
  JOINT_CONDITION_LABELS,
  MOISTURE_LABELS,
  PROBLEM_LABELS,
  SUBSTRATE_LABELS,
  TRAFFIC_LABELS,
  YES_NO_LABELS,
  YES_NO_UNKNOWN_LABELS,
} from '@/constants/labels';
import type {
  AreaUseType,
  CoatingCondition,
  ContaminationType,
  ExistingCoatingType,
  ExposureType,
  FloorProblemType,
  FloorSubstrate,
  JointCondition,
  MoisturePresence,
  RoofProblemType,
  RoofSubstrate,
  SurfaceType,
  TrafficLevel,
  YesNo,
  YesNoUnknown,
} from '@/types';

export type Choice<T extends string> = { value: T; label: string };

function choices<T extends string>(ids: readonly T[], labels: Record<T, string>): Choice<T>[] {
  return ids.map((value) => ({ value, label: labels[value] }));
}

export const FLOOR_SUBSTRATES: FloorSubstrate[] = [
  'concrete',
  'mortar',
  'ceramic',
  'tile',
  'existing_coating',
  'other',
];

export const ROOF_SUBSTRATES: RoofSubstrate[] = [
  'concrete',
  'metal',
  'membrane',
  'fiber_cement',
  'other',
];

export const FLOOR_PROBLEMS: FloorProblemType[] = [
  'cracks',
  'moisture',
  'wear',
  'detachment',
  'unevenness',
  'porosity',
  'contamination',
  'oil_grease',
  'damaged_joints',
  'impacts',
  'deteriorated_coating',
  'other',
];

export const ROOF_PROBLEMS: RoofProblemType[] = [
  'leaks',
  'moisture',
  'corrosion',
  'damaged_seals',
  'cracks',
  'detachments',
  'damaged_joints',
  'water_ponding',
  'perforations',
  'other',
];

export const YES_NO_OPTIONS = choices<YesNo>(['yes', 'no'], YES_NO_LABELS);
export const YES_NO_UNKNOWN_OPTIONS = choices<YesNoUnknown>(
  ['yes', 'no', 'unknown'],
  YES_NO_UNKNOWN_LABELS,
);
export const MOISTURE_OPTIONS = choices<MoisturePresence>(
  ['yes', 'no', 'undetermined'],
  MOISTURE_LABELS,
);
export const EXISTING_COATING_OPTIONS = choices<ExistingCoatingType>(
  ['epoxy', 'polyurethane', 'pu_cement', 'paint', 'ceramic', 'membrane', 'other'],
  EXISTING_COATING_LABELS,
);
export const COATING_CONDITION_OPTIONS = choices<CoatingCondition>(
  ['good', 'worn', 'deteriorated', 'partially_detached', 'very_deteriorated', 'unknown'],
  COATING_CONDITION_LABELS,
);
export const CONTAMINATION_OPTIONS = choices<ContaminationType>(
  ['oil', 'grease', 'chemicals', 'detergents', 'dust', 'production_residue', 'frequent_water', 'other'],
  CONTAMINATION_LABELS,
);
export const JOINT_CONDITION_OPTIONS = choices<JointCondition>(
  ['good', 'deteriorated', 'open', 'damaged_edges', 'unknown'],
  JOINT_CONDITION_LABELS,
);
export const AREA_USE_OPTIONS = choices<AreaUseType>(
  [
    'pedestrian',
    'pallet_jacks',
    'forklift',
    'vehicles',
    'heavy_machinery',
    'production',
    'warehouse',
    'dispatch',
    'wash_area',
    'cold_room',
    'laboratory',
    'exterior',
    'other',
  ],
  AREA_USE_LABELS,
);
export const TRAFFIC_OPTIONS = choices<TrafficLevel>(['low', 'medium', 'high'], TRAFFIC_LABELS);
export const EXPOSURE_OPTIONS = choices<ExposureType>(
  [
    'frequent_water',
    'pressure_wash',
    'chemicals',
    'oils_greases',
    'high_temp',
    'low_temp',
    'thermal_shock',
    'permanent_moisture',
    'exterior_uv',
    'impacts',
    'abrasion',
    'none',
  ],
  EXPOSURE_LABELS,
);

export function substratesForSurface(type?: SurfaceType) {
  return choices(type === 'roof' ? ROOF_SUBSTRATES : FLOOR_SUBSTRATES, SUBSTRATE_LABELS);
}

export function problemsForSurface(type?: SurfaceType) {
  return choices(type === 'roof' ? ROOF_PROBLEMS : FLOOR_PROBLEMS, PROBLEM_LABELS);
}

export function problemLabel(id: string) {
  return PROBLEM_LABELS[id as keyof typeof PROBLEM_LABELS] ?? id;
}
