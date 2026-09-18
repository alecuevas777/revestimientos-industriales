import { emptyServiceData } from '@/lib/service';
import type { Client, PhotoCategory, PhotoEvidence, Project, ProjectStatus, ServiceSpecificData, Survey, SurveyElement, SurveySector } from '@/types';

export type ClienteRow = {
  id: string;
  creado_por: string;
  nombre: string;
  rut: string | null;
  nombre_contacto: string | null;
  cargo_contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string | null;
  observaciones: string | null;
  archivado: boolean;
  archivado_en: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type ProyectoRow = {
  id: string;
  cliente_id: string;
  creado_por: string;
  nombre: string;
  codigo: string | null;
  direccion: string | null;
  ciudad: string | null;
  ubicacion: string | null;
  contacto_terreno: string | null;
  telefono_terreno: string | null;
  descripcion: string | null;
  observaciones: string | null;
  estado: ProjectStatus;
  creado_en: string;
  actualizado_en: string;
};

export type LevantamientoRow = {
  id: string;
  codigo: string;
  proyecto_id: string;
  usuario_id: string;
  tipo_servicio: Survey['serviceType'];
  estado: Survey['status'];
  alcance: Survey['scope'] | null;
  estado_general: Survey['overallCondition'] | null;
  motivo_visita: string | null;
  observaciones_generales: string | null;
  conclusion: string | null;
  planta_operativa: Survey['plantOperational'] | null;
  restricciones_horario: Survey['scheduleRestrictions'] | null;
  notas_acceso: string | null;
  maquinaria_retirar: Survey['machineryToRemove'] | null;
  comentarios_faena: string | null;
  datos_servicio: ServiceSpecificData;
  iniciado_en: string;
  actualizado_en: string;
  finalizado_en: string | null;
};

export type SectorRow = {
  id: string;
  levantamiento_id: string;
  nombre: string;
  area_aproximada: number | null;
  condicion: SurveySector['condition'];
  criticidad: SurveySector['severity'];
  problemas: string[];
  otro_problema: string | null;
  usos: string[];
  otro_uso: string | null;
  nivel_trafico: SurveySector['trafficLevel'] | null;
  exposiciones: string[];
  observaciones: string | null;
  recomendacion: string | null;
  creado_en: string;
  actualizado_en: string;
};

export type ElementoRow = {
  id: string;
  levantamiento_id: string;
  sector_id: string;
  tipo_elemento: string;
  referencia: string | null;
  material: string | null;
  condicion: SurveyElement['condition'];
  nivel_corrosion: SurveyElement['corrosionLevel'] | null;
  problemas: string[];
  otro_problema: string | null;
  exposiciones: string[];
  observaciones: string | null;
  criticidad: SurveyElement['severity'];
  creado_en: string;
  actualizado_en: string;
};

export type FotoRow = {
  id: string;
  levantamiento_id: string;
  sector_id: string | null;
  elemento_id: string | null;
  ruta_storage: string | null;
  uri_local: string | null;
  categoria: string | null;
  leyenda: string | null;
  creado_en: string;
};

function optional(value?: string | null) {
  return value?.trim() ? value : null;
}

export function clientToRow(client: Client, userId: string): ClienteRow {
  return {
    id: client.id,
    creado_por: userId,
    nombre: client.name,
    rut: optional(client.rut),
    nombre_contacto: optional(client.contactName),
    cargo_contacto: optional(client.contactRole),
    telefono: optional(client.phone),
    email: optional(client.email),
    direccion: optional(client.address),
    ciudad: optional(client.city),
    observaciones: optional(client.observations),
    archivado: client.archived,
    archivado_en: client.archivedAt ?? null,
    creado_en: client.createdAt,
    actualizado_en: client.updatedAt,
  };
}

export function clientFromRow(row: ClienteRow): Client {
  return {
    id: row.id,
    name: row.nombre,
    rut: row.rut ?? undefined,
    contactName: row.nombre_contacto ?? undefined,
    contactRole: row.cargo_contacto ?? undefined,
    phone: row.telefono ?? undefined,
    email: row.email ?? undefined,
    address: row.direccion ?? undefined,
    city: row.ciudad ?? undefined,
    observations: row.observaciones ?? undefined,
    archived: row.archivado,
    archivedAt: row.archivado_en ?? undefined,
    createdAt: row.creado_en,
    updatedAt: row.actualizado_en,
  };
}

export function projectToRow(project: Project, userId: string): ProyectoRow {
  return {
    id: project.id,
    cliente_id: project.clientId,
    creado_por: userId,
    nombre: project.name,
    codigo: optional(project.code),
    direccion: optional(project.address),
    ciudad: optional(project.city),
    ubicacion: optional(project.location),
    contacto_terreno: optional(project.siteContactName),
    telefono_terreno: optional(project.siteContactPhone),
    descripcion: optional(project.description),
    observaciones: optional(project.observations),
    estado: project.status,
    creado_en: project.createdAt,
    actualizado_en: project.updatedAt,
  };
}

export function projectFromRow(row: ProyectoRow): Project {
  return {
    id: row.id,
    clientId: row.cliente_id,
    name: row.nombre,
    code: row.codigo ?? undefined,
    address: row.direccion ?? undefined,
    city: row.ciudad ?? undefined,
    location: row.ubicacion ?? undefined,
    siteContactName: row.contacto_terreno ?? undefined,
    siteContactPhone: row.telefono_terreno ?? undefined,
    description: row.descripcion ?? undefined,
    observations: row.observaciones ?? undefined,
    status: row.estado,
    createdAt: row.creado_en,
    updatedAt: row.actualizado_en,
  };
}

export function surveyToRow(survey: Survey): LevantamientoRow {
  return {
    id: survey.id,
    codigo: survey.code,
    proyecto_id: survey.projectId,
    usuario_id: survey.userId,
    tipo_servicio: survey.serviceType,
    estado: survey.status,
    alcance: survey.scope ?? null,
    estado_general: survey.overallCondition ?? null,
    motivo_visita: optional(survey.visitReason),
    observaciones_generales: optional(survey.generalObservations),
    conclusion: optional(survey.conclusion),
    planta_operativa: survey.plantOperational ?? null,
    restricciones_horario: survey.scheduleRestrictions ?? null,
    notas_acceso: optional(survey.accessNotes),
    maquinaria_retirar: survey.machineryToRemove ?? null,
    comentarios_faena: optional(survey.siteComments),
    datos_servicio: survey.serviceData,
    iniciado_en: survey.startedAt,
    actualizado_en: survey.updatedAt,
    finalizado_en: survey.completedAt ?? null,
  };
}

export function sectorToRow(sector: SurveySector): SectorRow {
  return {
    id: sector.id,
    levantamiento_id: sector.surveyId,
    nombre: sector.name,
    area_aproximada: sector.approximateArea ?? null,
    condicion: sector.condition,
    criticidad: sector.severity,
    problemas: sector.problems,
    otro_problema: optional(sector.otherProblem),
    usos: sector.uses,
    otro_uso: optional(sector.otherUse),
    nivel_trafico: sector.trafficLevel ?? null,
    exposiciones: sector.exposures,
    observaciones: optional(sector.observations),
    recomendacion: optional(sector.recommendation),
    creado_en: sector.createdAt,
    actualizado_en: sector.updatedAt,
  };
}

export function elementToRow(element: SurveyElement): ElementoRow {
  return {
    id: element.id,
    levantamiento_id: element.surveyId,
    sector_id: element.sectorId,
    tipo_elemento: element.elementType,
    referencia: optional(element.reference),
    material: element.material ?? null,
    condicion: element.condition,
    nivel_corrosion: element.corrosionLevel ?? null,
    problemas: element.problems,
    otro_problema: optional(element.otherProblem),
    exposiciones: element.exposures,
    observaciones: optional(element.observations),
    criticidad: element.severity,
    creado_en: element.createdAt,
    actualizado_en: element.updatedAt,
  };
}

export function photoToRow(photo: PhotoEvidence): FotoRow {
  return {
    id: photo.id,
    levantamiento_id: photo.surveyId,
    sector_id: photo.sectorId ?? null,
    elemento_id: photo.elementId ?? null,
    ruta_storage: photo.storagePath ?? null,
    uri_local: photo.uri?.startsWith('http') ? null : photo.uri || null,
    categoria: photo.category ?? 'overview',
    leyenda: optional(photo.caption),
    creado_en: photo.createdAt,
  };
}

export function photoFromRow(row: FotoRow, uri: string): PhotoEvidence {
  return {
    id: row.id,
    uri,
    storagePath: row.ruta_storage ?? undefined,
    uploadStatus: row.ruta_storage ? 'ready' : undefined,
    surveyId: row.levantamiento_id,
    sectorId: row.sector_id ?? undefined,
    elementId: row.elemento_id ?? undefined,
    category: (row.categoria as PhotoCategory | null) ?? 'overview',
    caption: row.leyenda ?? undefined,
    createdAt: row.creado_en,
  };
}

export function sectorFromRow(row: SectorRow, elements: SurveyElement[], photos: PhotoEvidence[]): SurveySector {
  return {
    id: row.id,
    surveyId: row.levantamiento_id,
    name: row.nombre,
    approximateArea: row.area_aproximada ?? undefined,
    condition: row.condicion,
    severity: row.criticidad,
    problems: (row.problemas ?? []) as SurveySector['problems'],
    otherProblem: row.otro_problema ?? undefined,
    uses: (row.usos ?? []) as SurveySector['uses'],
    otherUse: row.otro_uso ?? undefined,
    trafficLevel: row.nivel_trafico ?? undefined,
    exposures: (row.exposiciones ?? []) as SurveySector['exposures'],
    observations: row.observaciones ?? undefined,
    recommendation: row.recomendacion ?? undefined,
    photos,
    elements,
    createdAt: row.creado_en,
    updatedAt: row.actualizado_en,
  };
}

export function elementFromRow(row: ElementoRow, photos: PhotoEvidence[]): SurveyElement {
  return {
    id: row.id,
    surveyId: row.levantamiento_id,
    sectorId: row.sector_id,
    elementType: row.tipo_elemento as SurveyElement['elementType'],
    reference: row.referencia ?? undefined,
    material: (row.material as SurveyElement['material']) ?? undefined,
    condition: row.condicion,
    corrosionLevel: row.nivel_corrosion ?? undefined,
    problems: (row.problemas ?? []) as SurveyElement['problems'],
    otherProblem: row.otro_problema ?? undefined,
    exposures: (row.exposiciones ?? []) as SurveyElement['exposures'],
    observations: row.observaciones ?? undefined,
    severity: row.criticidad,
    photos,
    createdAt: row.creado_en,
    updatedAt: row.actualizado_en,
  };
}

export function surveyFromParts(
  row: LevantamientoRow,
  sectors: SurveySector[],
  photos: PhotoEvidence[],
): Survey {
  return {
    id: row.id,
    code: row.codigo,
    projectId: row.proyecto_id,
    userId: row.usuario_id,
    serviceType: row.tipo_servicio,
    status: row.estado,
    scope: row.alcance ?? undefined,
    overallCondition: row.estado_general ?? undefined,
    visitReason: row.motivo_visita ?? undefined,
    generalObservations: row.observaciones_generales ?? undefined,
    conclusion: row.conclusion ?? undefined,
    plantOperational: row.planta_operativa ?? undefined,
    scheduleRestrictions: row.restricciones_horario ?? undefined,
    accessNotes: row.notas_acceso ?? undefined,
    machineryToRemove: row.maquinaria_retirar ?? undefined,
    siteComments: row.comentarios_faena ?? undefined,
    startedAt: row.iniciado_en,
    updatedAt: row.actualizado_en,
    completedAt: row.finalizado_en ?? undefined,
    serviceData: row.datos_servicio ?? emptyServiceData(row.tipo_servicio),
    sectors,
    photos,
  };
}
