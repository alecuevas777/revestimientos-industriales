const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export function parseDate(value: string) {
  return new Date(value);
}

export function formatDate(value: string) {
  const date = parseDate(value);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTime(value: string) {
  const date = parseDate(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDayLabel(value: string) {
  const date = parseDate(value);
  return isSameDay(date, new Date()) ? 'Hoy' : formatDate(value);
}

export function formatActivityStamp(value: string) {
  return `${formatDayLabel(value)} · ${formatTime(value)}`;
}

export function greetingForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function firstName(fullName: string) {
  return fullName.split(' ')[0] ?? fullName;
}

export function initials(fullName: string) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatRelative(value: string, now = new Date()) {
  const diff = now.getTime() - parseDate(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));
  if (minutes < 1) return 'hace unos segundos';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  return formatDate(value);
}

export function formatCompletedLabel(value: string, now = new Date()) {
  const date = parseDate(value);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const day = isSameDay(date, now) ? 'hoy' : isSameDay(date, yesterday) ? 'ayer' : formatDate(value);
  return `Finalizado ${day} · ${formatTime(value)}`;
}

export function formatArea(value?: number) {
  if (!value) return '—';
  return `${value.toLocaleString('es-CL')} m²`;
}
