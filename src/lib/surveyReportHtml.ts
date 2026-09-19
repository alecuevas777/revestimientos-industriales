import { CONDITION_LABELS, SEVERITY_LABELS, TRAFFIC_LABELS } from '@/constants/labels';
import { usesElements } from '@/constants/options';
import { APP_FOOTER, APP_WEBSITE } from '@/constants/brand';
import { exposureList, sectorProblemList, useList } from '@/lib/display';
import { formatArea, formatDateLong, formatTime } from '@/lib/format';
import {
  catalogReportPhotos,
  clientFields,
  conditionClass,
  elementLines,
  groupReportPhotos,
  projectFields,
  reportGaps,
  reportKpis,
  sectorPriorityLine,
  serviceConditionFields,
  serviceTitle,
  severityClass,
  shotRange,
  shotsForSector,
  visitFields,
  type ReportShot,
} from '@/lib/surveyReportData';
import type { Client, Project, Survey } from '@/types';

export type PreparedShot = ReportShot & { dataUri?: string };

function escapeHtml(value?: string) {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function text(value?: string) {
  const trimmed = value?.trim();
  return escapeHtml(trimmed || '—');
}

function kv(fields: { label: string; value: string }[]) {
  return `<dl class="kv">${fields
    .map((field) => `<dt>${escapeHtml(field.label)}</dt><dd>${text(field.value)}</dd>`)
    .join('')}</dl>`;
}

function chips(value: string) {
  if (!value || value === '—' || value === 'Sin problemas registrados') return escapeHtml(value || '—');
  return `<div class="chips">${value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<span class="chip">${escapeHtml(item)}</span>`)
    .join('')}</div>`;
}

function shotCard(shot: PreparedShot) {
  const frame = shot.dataUri
    ? `<img src="${shot.dataUri}" alt="${escapeHtml(shot.code)}" />`
    : `<div class="shot-missing">Fotografía no disponible</div>`;
  return `<article class="shot">
    <div class="shot-frame">${frame}</div>
    <div class="shot-meta">
      <div class="shot-code">${escapeHtml(shot.code)}</div>
      <dl class="shot-fields">
        <dt>Categoría</dt><dd>${escapeHtml(shot.category)}</dd>
        <dt>Nota</dt><dd>${escapeHtml(shot.caption)}</dd>
      </dl>
    </div>
  </article>`;
}

const CSS = `
@page { size: A4; margin: 14mm 14mm 16mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: "Segoe UI", Calibri, Arial, sans-serif;
  color: #121212;
  background: #fff;
  font-size: 9.5pt;
  line-height: 1.4;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
header.top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 3px solid #F96706;
}
.logo { height: 42px; width: auto; }
.brand-fallback { font-size: 22pt; font-weight: 800; letter-spacing: -0.4px; }
.brand-fallback span { color: #F96706; }
.doc-meta { text-align: right; }
.doc-kicker {
  font-size: 8pt;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #F96706;
  font-weight: 700;
  margin: 0 0 2px;
}
h1 { margin: 0; font-size: 18pt; font-weight: 800; letter-spacing: -0.4px; line-height: 1.15; }
.doc-code { margin-top: 4px; font-size: 10.5pt; font-weight: 700; }
.muted { color: #6B7280; }
.path { margin: 12px 0 14px; display: flex; border: 1px solid #E5E5E5; }
.path-step { flex: 1; padding: 8px 12px; min-width: 0; }
.path-step + .path-step { border-left: 1px solid #E5E5E5; }
.path-step.accent { background: #FFE8D6; }
.path-label { font-size: 7.5pt; letter-spacing: 0.1em; text-transform: uppercase; color: #6B7280; font-weight: 700; margin: 0 0 2px; }
.path-value { font-size: 10.5pt; font-weight: 700; }
.path-sub { font-size: 8pt; color: #6B7280; margin-top: 1px; }
.kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 14px; }
.kpi { border: 1px solid #E5E5E5; padding: 8px 10px; }
.kpi b { display: block; font-size: 13pt; font-weight: 800; line-height: 1.1; }
.kpi span { font-size: 7.5pt; color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
h2 {
  font-size: 10pt;
  margin: 16px 0 8px;
  padding: 5px 9px;
  background: #121212;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  page-break-after: avoid;
}
h2 .n { color: #F96706; margin-right: 6px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
.kv { display: grid; grid-template-columns: 118px 1fr; gap: 2px 10px; }
.kv dt { color: #6B7280; font-size: 8.5pt; }
.kv dd { margin: 0; font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; }
.chip { font-size: 8pt; font-weight: 700; padding: 2px 7px; border: 1px solid #E5E5E5; background: #F5F5F5; }
.badge { display: inline-block; font-size: 8pt; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; padding: 2px 8px; }
.b-regular { background: #FEF3C7; color: #92400E; }
.b-bad { background: #FEE2E2; color: #991B1B; }
.b-good { background: #D1FAE5; color: #065F46; }
.b-high { background: #FFE8D6; color: #9A3412; }
.b-med { background: #FEF3C7; color: #92400E; }
.b-low { background: #E5E7EB; color: #374151; }
.b-critical { background: #FEE2E2; color: #7F1D1D; }
p { margin: 0 0 8px; }
.note { background: #F5F5F5; border-left: 3px solid #F96706; padding: 8px 10px; margin: 8px 0 0; }
.warn { background: #FEF3C7; border-left: 3px solid #D97706; padding: 8px 10px; margin: 0 0 12px; font-size: 8.5pt; }
.sector { border: 1px solid #E5E5E5; margin-bottom: 10px; page-break-inside: avoid; }
.sector-h { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 8px 10px; background: #F5F5F5; border-bottom: 1px solid #E5E5E5; }
.sector-h h3 { margin: 0; font-size: 11pt; }
.sector-id { font-size: 8pt; color: #6B7280; font-weight: 700; letter-spacing: 0.08em; }
.sector-b { padding: 10px; }
.ref { font-size: 8.5pt; font-weight: 700; color: #9A3412; }
.element { margin-top: 8px; padding: 8px; background: #F5F5F5; }
.element b { display: block; margin-bottom: 2px; }
.concl { border: 1px solid #F96706; padding: 12px; page-break-inside: avoid; }
.concl h3 { margin: 0 0 6px; font-size: 11pt; }
.page-break { page-break-before: always; }
table.plain { width: 100%; border-collapse: collapse; }
table.plain th, table.plain td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #E5E5E5; vertical-align: top; font-size: 9pt; }
table.plain th { width: 28%; color: #6B7280; font-weight: 600; }
.evidence-lead { margin: 0 0 12px; color: #6B7280; }
.evidence-group { margin: 0 0 18px; }
.evidence-h { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; padding-bottom: 6px; margin-bottom: 10px; border-bottom: 2px solid #121212; page-break-after: avoid; }
.evidence-h h3 { margin: 0; font-size: 11pt; }
.evidence-h .range { font-size: 8.5pt; color: #6B7280; font-weight: 700; }
.shots { display: flex; flex-direction: column; gap: 14px; }
.shot { border: 1px solid #E5E5E5; page-break-inside: avoid; break-inside: avoid; }
.shot-frame {
  background: #1A1A1A;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.shot-frame img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: 145mm;
  object-fit: contain;
  object-position: center;
}
.shot-missing {
  min-height: 80mm;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  font-size: 8.5pt;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.shot-meta { padding: 10px 12px 12px; background: #fff; border-top: 1px solid #E5E5E5; }
.shot-code { font-weight: 800; font-size: 12pt; margin-bottom: 6px; }
.shot-fields { display: grid; grid-template-columns: 78px 1fr; gap: 4px 10px; margin: 0; }
.shot-fields dt { color: #6B7280; font-size: 8.5pt; padding-top: 1px; }
.shot-fields dd { margin: 0; font-weight: 600; font-size: 10pt; }
.foot-note { margin-top: 16px; font-size: 8pt; color: #6B7280; border-top: 1px solid #E5E5E5; padding-top: 8px; white-space: pre-line; }
`;

export function buildSurveyReportHtml(input: {
  survey: Survey;
  client?: Client;
  project?: Project;
  technician: string;
  shots: PreparedShot[];
  logoSrc?: string;
}) {
  const { survey, client, project, technician, shots, logoSrc } = input;
  const groups = groupReportPhotos(shots);
  const gaps = reportGaps(client, project);
  const kpis = reportKpis(survey);
  const conditions = serviceConditionFields(survey);
  const address = [project?.address || client?.address, project?.city || client?.city].filter(Boolean).join(', ');
  const logo = logoSrc
    ? `<img class="logo" src="${logoSrc}" alt="VICAST" />`
    : `<div class="brand-fallback">VICAST</div>`;
  const showElements = usesElements(survey.serviceType);

  const sectorHtml = survey.sectors
    .map((sector, index) => {
      const linked = shotsForSector(shots, sector);
      const evidence = linked.length > 0 ? `${shotRange(linked)} · Anexo fotográfico` : 'Sin fotografías';
      const elements = showElements ? elementLines(sector) : [];
      return `<article class="sector">
        <div class="sector-h">
          <div>
            <div class="sector-id">SECTOR ${String(index + 1).padStart(2, '0')}</div>
            <h3>${text(sector.name)}</h3>
          </div>
          <div>
            <span class="badge ${conditionClass(sector.condition)}">${escapeHtml(CONDITION_LABELS[sector.condition])}</span>
            <span class="badge ${severityClass(sector.severity)}">Criticidad ${escapeHtml(SEVERITY_LABELS[sector.severity])}</span>
          </div>
        </div>
        <div class="sector-b">
          <div class="grid-2">
            ${kv([
              { label: 'Superficie', value: formatArea(sector.approximateArea) },
              { label: 'Uso', value: useList(sector.uses, sector.otherUse) },
              { label: 'Tráfico', value: sector.trafficLevel ? TRAFFIC_LABELS[sector.trafficLevel] : '—' },
            ])}
            ${kv([
              { label: 'Exposición', value: exposureList(sector.exposures) },
              { label: 'Problemas', value: sectorProblemList(sector) },
              { label: 'Evidencia', value: evidence },
            ])}
          </div>
          ${sector.observations?.trim() ? `<p style="margin-top:8px"><b>Observación.</b> ${escapeHtml(sector.observations.trim())}</p>` : ''}
          ${sector.recommendation?.trim() ? `<p><b>Recomendación de terreno.</b> ${escapeHtml(sector.recommendation.trim())}</p>` : ''}
          ${elements
            .map(
              (element) => `<div class="element">
                <b>${escapeHtml(element.title)}</b>
                <div class="muted">${escapeHtml(element.meta)}</div>
                <div>${escapeHtml(element.problems)}</div>
                ${element.observations ? `<div>${escapeHtml(element.observations)}</div>` : ''}
              </div>`,
            )
            .join('')}
        </div>
      </article>`;
    })
    .join('');

  const evidenceIndex = groups
    .map(
      (group) =>
        `<tr><th>${escapeHtml(group.range)}</th><td>${escapeHtml(group.title)}</td><td>${escapeHtml(
          [...new Set(group.shots.map((shot) => shot.category))].join(', '),
        )}</td><td>${escapeHtml(group.shots.map((shot) => shot.caption).filter((caption) => caption !== 'Sin nota').join(' · ') || '—')}</td></tr>`,
    )
    .join('');

  const evidenceGroups = groups
    .map(
      (group) => `<section class="evidence-group">
          <div class="evidence-h">
            <h3>${escapeHtml(group.title)}</h3>
            <div class="range">${escapeHtml(group.range)}</div>
          </div>
          <div class="shots">${group.shots.map(shotCard).join('')}</div>
        </section>`,
    )
    .join('');

  const footerLine = APP_FOOTER.replace('\n', ' · ');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(survey.code)} · Informe de levantamiento</title>
  <style>${CSS}</style>
</head>
<body>
  <header class="top">
    ${logo}
    <div class="doc-meta">
      <p class="doc-kicker">Informe de levantamiento</p>
      <h1>${escapeHtml(serviceTitle(survey))}</h1>
      <div class="doc-code">${escapeHtml(survey.code)}</div>
      <div class="muted">${escapeHtml(formatDateLong(survey.startedAt))} · Finalizado</div>
    </div>
  </header>

  <div class="path">
    <div class="path-step">
      <p class="path-label">Cliente</p>
      <div class="path-value">${text(client?.name)}</div>
      <div class="path-sub">${text([client?.rut, client?.city].filter(Boolean).join(' · '))}</div>
    </div>
    <div class="path-step">
      <p class="path-label">Proyecto / recinto</p>
      <div class="path-value">${text(project?.name)}</div>
      <div class="path-sub">${text([project?.code, address].filter(Boolean).join(' · '))}</div>
    </div>
    <div class="path-step accent">
      <p class="path-label">Levantamiento</p>
      <div class="path-value">${escapeHtml(survey.code)}</div>
      <div class="path-sub">${text(survey.scope ? `Visita · ${visitFields(survey)[0].value}` : 'Visita de evaluación')}</div>
    </div>
  </div>

  ${
    gaps.length
      ? `<div class="warn">Faltan datos para el informe: ${escapeHtml(gaps.join(', '))}. El resto del levantamiento se exporta igual.</div>`
      : ''
  }

  <div class="kpis" style="grid-template-columns:repeat(${kpis.length},1fr)">
    ${kpis
      .map((kpi) => `<div class="kpi"><span>${escapeHtml(kpi.label)}</span><b>${escapeHtml(kpi.value)}</b></div>`)
      .join('')}
  </div>

  <h2><span class="n">01</span>Identificación</h2>
  <div class="grid-2">${kv(clientFields(client))}${kv(projectFields(client, project))}</div>

  <h2><span class="n">02</span>Visita</h2>
  <div class="grid-2">
    ${kv([
      { label: 'Fecha', value: formatDateLong(survey.startedAt) },
      { label: 'Hora de inicio', value: formatTime(survey.startedAt) },
      { label: 'Técnico', value: technician },
      { label: 'Servicio', value: serviceTitle(survey) },
    ])}
    ${kv(visitFields(survey))}
  </div>

  <h2><span class="n">03</span>Condiciones del recinto</h2>
  <table class="plain">
    ${conditions
      .map((field) => `<tr><th>${escapeHtml(field.label)}</th><td>${field.label.toLowerCase().includes('problema') ? chips(field.value) : text(field.value)}</td></tr>`)
      .join('')}
  </table>
  ${survey.generalObservations?.trim() ? `<div class="note">${escapeHtml(survey.generalObservations.trim())}</div>` : ''}

  <div class="page-break"></div>
  <h2><span class="n">04</span>Hallazgos por sector</h2>
  ${
    survey.sectors.length === 0
      ? '<p class="muted">No se registraron sectores en este levantamiento.</p>'
      : `<p class="muted">Cada sector es una zona del recinto. Las fotografías van en el anexo, citadas por código.</p>${sectorHtml}`
  }

  <h2><span class="n">05</span>Conclusión</h2>
  <div class="concl">
    <h3>${text(survey.conclusion || 'Sin conclusión registrada.')}</h3>
    ${survey.accessNotes?.trim() && survey.scheduleRestrictions === 'yes' ? `<p><b>Acceso.</b> ${escapeHtml(survey.accessNotes.trim())}</p>` : ''}
    ${sectorPriorityLine(survey) ? `<p style="margin:0"><b>Prioridad de intervención:</b> ${escapeHtml(sectorPriorityLine(survey))}</p>` : ''}
  </div>

  <div class="page-break"></div>
  <h2><span class="n">06</span>Evidencia fotográfica</h2>
  ${
    shots.length === 0
      ? '<p class="muted">No se registraron fotografías en este levantamiento.</p>'
      : `<p class="evidence-lead">Cada fotografía se muestra completa, sin recortes. Debajo van el código, la categoría y la nota.</p>
        <table class="plain">
          <thead><tr><th style="width:14%">Código</th><th style="width:28%">Ubicación</th><th style="width:22%">Categoría</th><th>Nota</th></tr></thead>
          <tbody>${evidenceIndex}</tbody>
        </table>
        ${evidenceGroups}`
  }

  <p class="foot-note">${escapeHtml(client?.name || 'Cliente')} · ${escapeHtml(project?.name || 'Proyecto')} · ${escapeHtml(survey.code)}
${escapeHtml(footerLine)} · ${escapeHtml(APP_WEBSITE.replace('https://', ''))}</p>
</body>
</html>`;
}
