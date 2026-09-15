import type {
  AreaUseType,
  CoatingCondition,
  CorrosionLevel,
  CorrosionElementType,
  ElementType,
  ExistingCoatingType,
  ExposureType,
  FloorSurfaceKind,
  FloorSubstrate,
  MetalMaterial,
  OperatingTemp,
  PhotoCategory,
  ProblemType,
  ProjectStatus,
  ProtectionType,
  RoofElementType,
  RoofKind,
  ServiceType,
  Severity,
  SurfaceCondition,
  SurveyScope,
  SurveyStatus,
  TrafficLevel,
  YesNo,
  YesNoUnknown,
} from '@/types';

export const WORKER_ROLE = 'Técnico de terreno';

export const DEMO_USER = {
  id: 'user_demo',
  name: 'Técnico Demo',
  email: 'tecnico@demo.cl',
  role: WORKER_ROLE,
} as const;

export const DEMO_PASSWORD = '123456';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  epoxy: 'Sistemas epóxicos',
  pu_cement: 'Poliuretano cemento',
  roof_waterproofing: 'Impermeabilización de cubiertas',
  corrosion_control: 'Control de corrosión',
};

export const SERVICE_TYPE_HINTS: Record<ServiceType, string> = {
  epoxy: 'Pisos y superficies para revestimientos epóxicos.',
  pu_cement: 'Pisos con exigencia mecánica, química o térmica.',
  roof_waterproofing: 'Cubiertas, filtraciones, sellos y deterioro.',
  corrosion_control: 'Estructuras y elementos metálicos.',
};

export const SERVICE_TYPE_SHORT: Record<ServiceType, string> = {
  epoxy: 'Epóxico',
  pu_cement: 'PU cemento',
  roof_waterproofing: 'Cubierta',
  corrosion_control: 'Corrosión',
};

export const SCOPE_LABELS: Record<SurveyScope, string> = {
  complete: 'Completa',
  sectors: 'Por sectores',
  critical_points: 'Puntos críticos',
};

export const SCOPE_HINTS: Record<SurveyScope, string> = {
  complete: 'Se registra el recinto como un conjunto.',
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
  crack: 'Fisura',
  joint: 'Junta',
  moisture: 'Humedad',
  detachment: 'Desprendimiento',
  contamination: 'Contaminación',
  leak: 'Filtración',
  corrosion: 'Corrosión',
  seal: 'Sello',
  overlap: 'Traslapo',
  gutter: 'Canaleta',
  perforation: 'Perforación',
  coating: 'Recubrimiento',
  weld: 'Soldadura',
  detail: 'Detalle',
  other: 'Otro',
};

export const FLOOR_SURFACE_LABELS: Record<FloorSurfaceKind, string> = {
  floor: 'Piso',
  baseboard: 'Zócalo',
  channel: 'Canaleta',
  other: 'Otro',
};

export const FLOOR_SUBSTRATE_LABELS: Record<FloorSubstrate, string> = {
  concrete: 'Hormigón',
  mortar: 'Mortero',
  ceramic: 'Cerámica',
  existing_coating: 'Revestimiento existente',
  other: 'Otro',
};

export const ROOF_KIND_LABELS: Record<RoofKind, string> = {
  metal: 'Metálica',
  concrete: 'Hormigón',
  membrane: 'Membrana',
  fiber_cement: 'Fibrocemento',
  panel: 'Panel',
  other: 'Otra',
};

export const EXISTING_COATING_LABELS: Record<ExistingCoatingType, string> = {
  epoxy: 'Epóxico',
  polyurethane: 'Poliuretano',
  pu_cement: 'Poliuretano cemento',
  paint: 'Pintura',
  other: 'Otro',
};

export const COATING_CONDITION_LABELS: Record<CoatingCondition, string> = {
  good: 'Bueno',
  worn: 'Desgastado',
  deteriorated: 'Deteriorado',
  detached: 'Desprendido',
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

export const OPERATING_TEMP_LABELS: Record<OperatingTemp, string> = {
  ambient: 'Ambiente',
  refrigerated: 'Refrigerada',
  high: 'Alta temperatura',
  variable: 'Temperatura variable',
  unknown: 'Desconocida',
};

export const CORROSION_LEVEL_LABELS: Record<CorrosionLevel, string> = {
  none: 'No visible',
  slight: 'Leve',
  moderate: 'Moderada',
  severe: 'Severa',
  undetermined: 'No determinado',
};

export const PROBLEM_LABELS: Record<ProblemType, string> = {
  cracks: 'Fisuras',
  moisture: 'Humedad',
  wear: 'Desgaste',
  detachment: 'Desprendimiento',
  unevenness: 'Desnivel',
  porosity: 'Porosidad',
  damaged_joints: 'Juntas deterioradas',
  oil_grease: 'Aceite / grasa',
  chemical_contamination: 'Contaminación química',
  impacts: 'Impactos',
  deteriorated_coating: 'Revestimiento deteriorado',
  other: 'Otro',
  leaks: 'Filtraciones',
  corrosion: 'Corrosión',
  perforations: 'Perforaciones',
  damaged_seals: 'Sellos deteriorados',
  membrane_detached: 'Membrana desprendida',
  damaged_overlaps: 'Traslapos deteriorados',
  damaged_fasteners: 'Fijaciones deterioradas',
  water_ponding: 'Acumulación de agua',
  deformations: 'Deformaciones',
  surface_rust: 'Óxido superficial',
  general_corrosion: 'Corrosión generalizada',
  localized_corrosion: 'Corrosión localizada',
  coating_detached: 'Recubrimiento desprendido',
  blistered_paint: 'Pintura ampollada',
  flaking_paint: 'Pintura descascarada',
  exposed_metal: 'Metal expuesto',
  permanent_moisture: 'Humedad permanente',
  chemical_attack: 'Ataque químico',
  joint_corrosion: 'Corrosión en uniones',
  weld_corrosion: 'Corrosión en soldaduras',
};

export const AREA_USE_LABELS: Record<AreaUseType, string> = {
  pedestrian: 'Tránsito peatonal',
  pallet_jacks: 'Transpaletas',
  forklift: 'Grúa horquilla',
  vehicles: 'Vehículos',
  machinery: 'Maquinaria',
  production: 'Producción',
  warehouse: 'Bodega',
  dispatch: 'Despacho',
  other: 'Otro',
};

export const TRAFFIC_LABELS: Record<TrafficLevel, string> = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
};

export const EXPOSURE_LABELS: Record<ExposureType, string> = {
  water: 'Agua',
  oils: 'Aceites',
  greases: 'Grasas',
  chemicals: 'Químicos',
  abrasion: 'Abrasión',
  severe_abrasion: 'Abrasión severa',
  impacts: 'Impactos',
  moisture: 'Humedad',
  frequent_wash: 'Lavado frecuente',
  pressure_wash: 'Lavado a presión',
  hot_water: 'Agua caliente',
  permanent_moisture: 'Humedad permanente',
  thermal_shock: 'Choque térmico',
  dry_interior: 'Interior seco',
  exterior: 'Exterior',
  frequent_moisture: 'Humedad frecuente',
  marine: 'Ambiente marino',
  industrial: 'Ambiente industrial',
  high_temp: 'Alta temperatura',
  condensation: 'Condensación',
  other: 'Otro',
};

export const ELEMENT_TYPE_LABELS: Record<ElementType, string> = {
  floor: 'Piso',
  baseboard: 'Zócalo',
  channel: 'Canaleta',
  other: 'Otro',
  gutter: 'Canaleta',
  downspout: 'Bajada de agua',
  overlap: 'Traslapo',
  seal: 'Sello',
  fastener: 'Fijación',
  junction: 'Encuentro',
  skylight: 'Lucarna',
  penetration: 'Pasada de ducto',
  edge: 'Borde',
  ridge: 'Cumbrera',
  steel_structure: 'Estructura metálica',
  beam: 'Viga',
  column: 'Pilar',
  walkway: 'Pasarela',
  platform: 'Plataforma',
  stair: 'Escalera',
  railing: 'Baranda',
  pipe: 'Tubería',
  tank: 'Estanque',
  support: 'Soporte',
  equipment: 'Equipo',
};

export const ROOF_ELEMENT_LABELS: Record<RoofElementType, string> = {
  gutter: 'Canaletas',
  downspout: 'Bajadas de agua',
  overlap: 'Traslapos',
  seal: 'Sellos',
  fastener: 'Fijaciones',
  junction: 'Encuentros',
  skylight: 'Lucarnas',
  penetration: 'Pasadas de ductos',
  edge: 'Bordes',
  ridge: 'Cumbreras',
  other: 'Otro',
};

export const CORROSION_ELEMENT_LABELS: Record<CorrosionElementType, string> = {
  steel_structure: 'Estructura metálica',
  beam: 'Viga',
  column: 'Pilar',
  walkway: 'Pasarela',
  platform: 'Plataforma',
  stair: 'Escalera',
  railing: 'Baranda',
  pipe: 'Tubería',
  tank: 'Estanque',
  support: 'Soporte',
  equipment: 'Equipo',
  other: 'Otro',
};

export const MATERIAL_LABELS: Record<MetalMaterial, string> = {
  carbon_steel: 'Acero al carbono',
  galvanized: 'Acero galvanizado',
  stainless: 'Acero inoxidable',
  aluminum: 'Aluminio',
  other: 'Otro',
  unknown: 'Desconocido',
};

export const PROTECTION_LABELS: Record<ProtectionType, string> = {
  paint: 'Pintura',
  anticorrosive: 'Sistema anticorrosivo',
  galvanized: 'Galvanizado',
  other: 'Otro',
  unknown: 'Desconocido',
};

export const WIZARD_STEPS = [
  { id: 'info', title: 'Información', short: 'Info' },
  { id: 'conditions', title: 'Condiciones', short: 'Condiciones' },
  { id: 'sectors', title: 'Sectores', short: 'Sectores' },
  { id: 'evidence', title: 'Evidencia', short: 'Evidencia' },
  { id: 'notes', title: 'Observaciones', short: 'Notas' },
  { id: 'review', title: 'Revisión', short: 'Revisión' },
] as const;
