import {
  COATING_CONDITION_LABELS,
  CONDITION_LABELS,
  CORROSION_LEVEL_LABELS,
  EXISTING_COATING_LABELS,
  FLOOR_SUBSTRATE_LABELS,
  FLOOR_SURFACE_LABELS,
  MATERIAL_LABELS,
  OPERATING_TEMP_LABELS,
  PHOTO_CATEGORY_LABELS,
  PROBLEM_LABELS,
  PROTECTION_LABELS,
  ROOF_KIND_LABELS,
  SCOPE_LABELS,
  SERVICE_TYPE_LABELS,
  SEVERITY_LABELS,
  TRAFFIC_LABELS,
  YES_NO_LABELS,
  YES_NO_UNKNOWN_LABELS,
} from '@/constants/labels';
import { usesElements } from '@/constants/options';
import { elementTitle, exposureList, problemList, sectorProblemList, useList } from '@/lib/display';
import { formatArea } from '@/lib/format';
import { clientProjectReportGaps } from '@/lib/reportReady';
import { elementCount, maxSeverity, photoCount, surveyArea } from '@/lib/survey';
import type { Client, PhotoEvidence, Project, Severity, Survey, SurveySector } from '@/types';

const SEVERITY_RANK: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export type ReportShot = {
  code: string;
  photo: PhotoEvidence;
  groupId: string;
  groupTitle: string;
  category: string;
  caption: string;
};

export type ReportShotGroup = {
  id: string;
  title: string;
  range: string;
  shots: ReportShot[];
};

export type ReportField = { label: string; value: string };

function slugPart(value?: string) {
  const cleaned = (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'sin-nombre';
}

export function surveyReportFileName(survey: Survey, client?: Client, project?: Project) {
  return `${survey.code}_${slugPart(client?.name)}_${slugPart(project?.name)}.pdf`;
}

export function photoCode(index: number) {
  return `F.${String(index).padStart(2, '0')}`;
}

export function shotRange(shots: ReportShot[]) {
  if (shots.length === 0) return '';
  if (shots.length === 1) return shots[0].code;
  return `${shots[0].code} – ${shots[shots.length - 1].code}`;
}

export function catalogReportPhotos(survey: Survey): ReportShot[] {
  const shots: ReportShot[] = [];
  let index = 1;

  function push(photo: PhotoEvidence, groupId: string, groupTitle: string) {
    shots.push({
      code: photoCode(index),
      photo,
      groupId,
      groupTitle,
      category: photo.category ? PHOTO_CATEGORY_LABELS[photo.category] : 'Sin categoría',
      caption: photo.caption?.trim() || 'Sin nota',
    });
    index += 1;
  }

  for (const photo of survey.photos) {
    push(photo, 'visit', 'Contexto del recinto');
  }

  survey.sectors.forEach((sector, sectorIndex) => {
    const title = `Sector ${String(sectorIndex + 1).padStart(2, '0')} · ${sector.name.trim() || 'Sin nombre'}`;
    for (const photo of sector.photos) push(photo, sector.id, title);
    for (const element of sector.elements) {
      for (const photo of element.photos) push(photo, sector.id, title);
    }
  });

  return shots;
}

export function groupReportPhotos(shots: ReportShot[]): ReportShotGroup[] {
  const groups: ReportShotGroup[] = [];
  for (const shot of shots) {
    const current = groups[groups.length - 1];
    if (!current || current.id !== shot.groupId) {
      groups.push({ id: shot.groupId, title: shot.groupTitle, range: shot.code, shots: [shot] });
    } else {
      current.shots.push(shot);
    }
  }
  return groups.map((group) => ({ ...group, range: shotRange(group.shots) }));
}

export function shotsForSector(shots: ReportShot[], sector: SurveySector) {
  return shots.filter((shot) => shot.groupId === sector.id);
}

export function serviceConditionFields(survey: Survey): ReportField[] {
  const data = survey.serviceData;
  if (data.type === 'epoxy' || data.type === 'pu_cement') {
    const coating =
      data.existingCoating === 'yes'
        ? [
            data.existingCoatingType ? EXISTING_COATING_LABELS[data.existingCoatingType] : 'Sí',
            data.existingCoatingCondition ? COATING_CONDITION_LABELS[data.existingCoatingCondition] : null,
          ]
            .filter(Boolean)
            .join(' · ')
        : data.existingCoating
          ? YES_NO_UNKNOWN_LABELS[data.existingCoating]
          : '—';
    const fields: ReportField[] = [
      {
        label: 'Superficie',
        value: [data.surfaceKind ? FLOOR_SURFACE_LABELS[data.surfaceKind] : null, data.substrate ? FLOOR_SUBSTRATE_LABELS[data.substrate] : null]
          .filter(Boolean)
          .join(' · ') || '—',
      },
      { label: 'Revestimiento existente', value: coating },
      { label: 'Uso', value: useList(data.uses, data.otherUse) },
      { label: 'Exposición', value: exposureList(data.exposures) },
      { label: 'Problemas generales', value: problemList(data.problems, data.otherProblem) },
    ];
    if (data.type === 'pu_cement') {
      fields.splice(2, 0, {
        label: 'Temperatura operacional',
        value:
          [data.operatingTemp ? OPERATING_TEMP_LABELS[data.operatingTemp] : null, data.approxTempC ? `${data.approxTempC} °C` : null]
            .filter(Boolean)
            .join(' · ') || '—',
      });
    }
    return fields;
  }

  if (data.type === 'roof_waterproofing') {
    return [
      { label: 'Tipo de cubierta', value: data.roofKind ? ROOF_KIND_LABELS[data.roofKind] : '—' },
      { label: 'Problemas generales', value: problemList(data.problems, data.otherProblem) },
    ];
  }

  if (data.type === 'corrosion_control') {
    return [
      {
        label: 'Protección existente',
        value:
          data.existingProtection === 'yes'
            ? [
                data.protectionType ? PROTECTION_LABELS[data.protectionType] : 'Sí',
                data.protectionCondition ? COATING_CONDITION_LABELS[data.protectionCondition] : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : data.existingProtection
              ? YES_NO_UNKNOWN_LABELS[data.existingProtection]
              : '—',
      },
      { label: 'Exposición ambiental', value: exposureList(data.exposures) },
    ];
  }

  return [];
}

export function sectorPriorityLine(survey: Survey) {
  if (survey.sectors.length === 0) return '';
  const ordered = [...survey.sectors].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  return ordered.map((sector, index) => `${index + 1}) ${sector.name}`).join(' · ');
}

export function reportKpis(survey: Survey) {
  const area = surveyArea(survey);
  const highest = maxSeverity(survey);
  const items: { label: string; value: string }[] = [];
  if (area) items.push({ label: 'Superficie total', value: formatArea(area) });
  items.push({
    label: survey.sectors.length === 1 ? 'Sector' : 'Sectores',
    value: String(survey.sectors.length),
  });
  if (usesElements(survey.serviceType)) {
    items.push({
      label: elementCount(survey) === 1 ? 'Elemento' : 'Elementos',
      value: String(elementCount(survey)),
    });
  }
  items.push({
    label: photoCount(survey) === 1 ? 'Fotografía' : 'Fotografías',
    value: String(photoCount(survey)),
  });
  items.push({
    label: 'Condición general',
    value: survey.overallCondition ? CONDITION_LABELS[survey.overallCondition] : '—',
  });
  items.push({
    label: 'Mayor criticidad',
    value: highest ? SEVERITY_LABELS[highest] : '—',
  });
  return items.slice(0, 5);
}

export function visitFields(survey: Survey): ReportField[] {
  return [
    { label: 'Alcance', value: survey.scope ? SCOPE_LABELS[survey.scope] : '—' },
    { label: 'Planta operativa', value: survey.plantOperational ? YES_NO_LABELS[survey.plantOperational] : '—' },
    {
      label: 'Restricción de horario',
      value: survey.scheduleRestrictions === 'yes' ? survey.accessNotes?.trim() || 'Sí' : survey.scheduleRestrictions ? YES_NO_LABELS[survey.scheduleRestrictions] : '—',
    },
    { label: 'Motivo', value: survey.visitReason?.trim() || '—' },
  ];
}

export function clientFields(client?: Client): ReportField[] {
  return [
    { label: 'Empresa', value: client?.name || '—' },
    { label: 'RUT', value: client?.rut?.trim() || '—' },
    {
      label: 'Contacto empresa',
      value: [client?.contactName, client?.contactRole].filter(Boolean).join(' · ') || '—',
    },
    { label: 'Teléfono', value: client?.phone?.trim() || '—' },
    { label: 'Correo', value: client?.email?.trim() || '—' },
  ];
}

export function projectFields(client?: Client, project?: Project): ReportField[] {
  return [
    { label: 'Proyecto', value: project?.name || '—' },
    { label: 'Código interno', value: project?.code?.trim() || '—' },
    {
      label: 'Dirección',
      value: [project?.address || client?.address, project?.city || client?.city].filter(Boolean).join(', ') || '—',
    },
    { label: 'Contacto en terreno', value: project?.siteContactName?.trim() || '—' },
    { label: 'Teléfono terreno', value: project?.siteContactPhone?.trim() || '—' },
  ];
}

export function reportGaps(client?: Client, project?: Project) {
  return clientProjectReportGaps(client, project);
}

export function serviceTitle(survey: Survey) {
  return SERVICE_TYPE_LABELS[survey.serviceType];
}

export function conditionClass(value?: string) {
  if (value === 'good') return 'b-good';
  if (value === 'regular') return 'b-regular';
  if (value === 'bad') return 'b-bad';
  if (value === 'critical') return 'b-critical';
  return 'b-low';
}

export function severityClass(value?: Severity) {
  if (value === 'low') return 'b-low';
  if (value === 'medium') return 'b-med';
  if (value === 'high') return 'b-high';
  if (value === 'critical') return 'b-critical';
  return 'b-low';
}

export function elementLines(sector: SurveySector) {
  return sector.elements.map((element) => ({
    title: elementTitle(element),
    meta: [
      CONDITION_LABELS[element.condition],
      SEVERITY_LABELS[element.severity],
      element.material ? MATERIAL_LABELS[element.material] : null,
      element.corrosionLevel ? CORROSION_LEVEL_LABELS[element.corrosionLevel] : null,
    ]
      .filter(Boolean)
      .join(' · '),
    problems: problemList(element.problems, element.otherProblem),
    observations: element.observations?.trim() || '',
  }));
}

export { CONDITION_LABELS, SEVERITY_LABELS, TRAFFIC_LABELS };
