import type { Client, Project } from '@/types';

export function clientProjectReportGaps(client?: Client, project?: Project) {
  const missing: string[] = [];
  if (!client?.rut?.trim()) missing.push('RUT del cliente');
  if (!client?.contactName?.trim()) missing.push('Contacto de la empresa');
  if (!client?.phone?.trim()) missing.push('Teléfono del cliente');
  if (!(project?.address || client?.address)?.trim()) missing.push('Dirección del recinto');
  if (!(project?.city || client?.city)?.trim()) missing.push('Ciudad');
  if (!project?.siteContactName?.trim()) missing.push('Contacto en terreno');
  return missing;
}

export function surveyReadyToShare(client?: Client, project?: Project) {
  return Boolean(client && project && clientProjectReportGaps(client, project).length === 0);
}
