export class RemoteError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'RemoteError';
  }
}

function errorText(error: unknown) {
  if (!error || typeof error !== 'object') return String(error ?? '');
  const value = error as { message?: string; details?: string; hint?: string };
  return `${value.message ?? ''} ${value.details ?? ''} ${value.hint ?? ''}`;
}

function rawMessage(error: unknown) {
  return errorText(error).trim();
}

function errorCode(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return '';
}

export function remoteMessage(error: unknown, fallback: string) {
  if (error instanceof RemoteError) return error.message;
  const text = rawMessage(error).toLowerCase();
  if (errorCode(error) === '23505' || text.includes('duplicate')) {
    return 'Ya existe un registro con ese código.';
  }
  if (text.includes('row-level security') || text.includes('permission') || text.includes('not allowed')) {
    return 'No tienes permiso para guardar este registro.';
  }
  if (isOfflineError(error)) {
    return 'Sin conexión. Los cambios quedan en este dispositivo.';
  }
  return rawMessage(error) || fallback;
}

export function isOfflineError(error: unknown) {
  const text = rawMessage(error).toLowerCase();
  return (
    text.includes('network') ||
    text.includes('fetch') ||
    text.includes('offline') ||
    text.includes('failed to connect') ||
    text.includes('internet')
  );
}

export function isUniqueViolation(error: unknown) {
  return errorCode(error) === '23505' || errorText(error).toLowerCase().includes('duplicate');
}

export function uniqueOn(error: unknown, column: string) {
  return isUniqueViolation(error) && errorText(error).toLowerCase().includes(column.toLowerCase());
}
