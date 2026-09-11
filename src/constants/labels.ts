import type {
  AreaUseType,
  CoatingCondition,
  ContaminationType,
  ExistingCoatingType,
  ExposureType,
  JointCondition,
  MoisturePresence,
  PhotoCategory,
  ProblemType,
  ProjectStatus,
  Severity,
  SubstrateType,
  SurfaceCondition,
  SurfaceType,
  SurveyScope,
  SurveyStatus,
  TrafficLevel,
  YesNo,
  YesNoUnknown,
} from '@/types';

export const DEMO_USER = {
  id: 'user_demo',
  name: 'Técnico Demo',
  email: 'tecnico@demo.cl',
} as const;

export const DEMO_PASSWORD = '123456';

export const SURFACE_TYPE_LABELS: Record<SurfaceType, string> = {
  floor: 'Piso',
  roof: 'Cubierta / techo',
};

export const SCOPE_LABELS: Record<SurveyScope, string> = {
  complete: 'Completa',
  sectors: 'Por sectores',
  critical_points: 'Puntos críticos',
};

export const SCOPE_HINTS: Record<SurveyScope, string> = {
  complete: 'La superficie se registra como un conjunto.',
  sectors: 'Divide el recinto en zonas con su propio estado.',
  critical_points: 'Documenta solo los puntos que requieren atención.',
};

export const CONDITION_LABELS: Record<SurfaceCondition, string> = {
  good: 'Bueno',
  regular: 'Regular',
  bad: 'Malo',
  critical: 'Crítico',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  finished: 'Finalizado',
};

export const SURVEY_STATUS_LABELS: Record<SurveyStatus, string> = {
  draft: 'Borrador',
  completed: 'Finalizado',
};

export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  overview: 'Vista general',
  problem: 'Problema',
  crack: 'Fisura',
  joint: 'Junta',
  moisture: 'Humedad',
  detachment: 'Desprendimiento',
  contamination: 'Contaminación',
  detail: 'Detalle',
  reference: 'Referencia',
  other: 'Otro',
};

export const SUBSTRATE_LABELS: Record<SubstrateType, string> = {
  concrete: 'Hormigón',
  mortar: 'Mortero',
  ceramic: 'Cerámica',
  tile: 'Baldosa',
  existing_coating: 'Revestimiento existente',
  metal: 'Metal',
  membrane: 'Membrana',
  fiber_cement: 'Fibrocemento',
  other: 'Otro',
};

export const EXISTING_COATING_LABELS: Record<ExistingCoatingType, string> = {
  epoxy: 'Epóxico',
  polyurethane: 'Poliuretano',
  pu_cement: 'Poliuretano cemento',
  paint: 'Pintura',
  ceramic: 'Cerámica',
  membrane: 'Membrana',
  other: 'Otro',
};

export const COATING_CONDITION_LABELS: Record<CoatingCondition, string> = {
  good: 'Bueno',
  worn: 'Desgastado',
  deteriorated: 'Deteriorado',
  partially_detached: 'Desprendido parcialmente',
  very_deteriorated: 'Muy deteriorado',
  unknown: 'Desconocido',
};

export const YES_NO_LABELS: Record<YesNo, string> = {
  yes: 'Sí',
  no: 'No',
};

export const YES_NO_UNKNOWN_LABELS: Record<YesNoUnknown, string> = {
  yes: 'Sí',
  no: 'No',
  unknown: 'Desconocido',
};

export const MOISTURE_LABELS: Record<MoisturePresence, string> = {
  yes: 'Sí',
  no: 'No',
  undetermined: 'No determinado',
};

export const PROBLEM_LABELS: Record<ProblemType, string> = {
  cracks: 'Fisuras',
  moisture: 'Humedad',
  wear: 'Desgaste',
  detachment: 'Desprendimiento',
  unevenness: 'Desnivel',
  porosity: 'Porosidad',
  contamination: 'Contaminación',
  oil_grease: 'Aceite / grasa',
  damaged_joints: 'Juntas deterioradas',
  impacts: 'Impactos',
  deteriorated_coating: 'Revestimiento deteriorado',
  other: 'Otro',
  leaks: 'Filtraciones',
  corrosion: 'Corrosión',
  damaged_seals: 'Sellos deteriorados',
  detachments: 'Desprendimientos',
  water_ponding: 'Acumulación de agua',
  perforations: 'Perforaciones',
};

export const CONTAMINATION_LABELS: Record<ContaminationType, string> = {
  oil: 'Aceite',
  grease: 'Grasa',
  chemicals: 'Químicos',
  detergents: 'Detergentes',
  dust: 'Polvo',
  production_residue: 'Residuos de producción',
  frequent_water: 'Agua frecuente',
  other: 'Otro',
};

export const JOINT_CONDITION_LABELS: Record<JointCondition, string> = {
  good: 'Buen estado',
  deteriorated: 'Deterioradas',
  open: 'Abiertas',
  damaged_edges: 'Bordes dañados',
  unknown: 'Desconocido',
};

export const AREA_USE_LABELS: Record<AreaUseType, string> = {
  pedestrian: 'Tránsito peatonal',
  pallet_jacks: 'Transpaletas',
  forklift: 'Grúa horquilla',
  vehicles: 'Vehículos',
  heavy_machinery: 'Maquinaria pesada',
  production: 'Producción',
  warehouse: 'Bodega',
  dispatch: 'Despacho',
  wash_area: 'Área de lavado',
  cold_room: 'Cámara de frío',
  laboratory: 'Laboratorio',
  exterior: 'Exterior',
  other: 'Otro',
};

export const TRAFFIC_LABELS: Record<TrafficLevel, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
};

export const EXPOSURE_LABELS: Record<ExposureType, string> = {
  frequent_water: 'Agua frecuente',
  pressure_wash: 'Lavado a presión',
  chemicals: 'Productos químicos',
  oils_greases: 'Aceites / grasas',
  high_temp: 'Altas temperaturas',
  low_temp: 'Bajas temperaturas',
  thermal_shock: 'Choque térmico',
  permanent_moisture: 'Humedad permanente',
  exterior_uv: 'Exterior / UV',
  impacts: 'Impactos',
  abrasion: 'Abrasión',
  none: 'Ninguna relevante',
};

export const WIZARD_STEPS = [
  { id: 'info', title: 'Información', short: 'Info' },
  { id: 'surface', title: 'Superficie', short: 'Superficie' },
  { id: 'conditions', title: 'Condiciones', short: 'Condiciones' },
  { id: 'sectors', title: 'Sectores', short: 'Sectores' },
  { id: 'evidence', title: 'Evidencia', short: 'Evidencia' },
  { id: 'notes', title: 'Observaciones', short: 'Notas' },
  { id: 'review', title: 'Revisión', short: 'Revisión' },
] as const;
