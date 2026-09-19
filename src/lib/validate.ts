const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

export function emailError(value?: string, required = false) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return required ? 'Ingresa un correo electrónico.' : undefined;
  if (!EMAIL_RE.test(trimmed) || trimmed.includes('..')) {
    return 'Ingresa un correo válido, por ejemplo contacto@empresa.cl.';
  }
  return undefined;
}

export function phoneError(value?: string, required = false) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return required ? 'Ingresa un teléfono.' : undefined;

  let local = digitsOnly(trimmed);
  if (local.startsWith('56')) local = local.slice(2);
  if (local.startsWith('0')) local = local.slice(1);

  const mobile = local.length === 9 && local.startsWith('9');
  const landline = local.length === 8 || (local.length === 9 && /^[2-7]/.test(local));
  if (mobile || landline) return undefined;
  return 'Ingresa un teléfono chileno válido, por ejemplo +56 9 1234 5678.';
}

export function rutError(value?: string, required = false) {
  const raw = value?.trim() ?? '';
  if (!raw) return required ? 'Ingresa el RUT.' : undefined;

  const clean = raw.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (!/^\d{7,8}[0-9K]$/.test(clean)) {
    return 'Ingresa un RUT válido, por ejemplo 76.452.110-2.';
  }

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expected = 11 - (sum % 11);
  const check = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
  if (check !== dv) return 'El RUT ingresado no es válido.';
  return undefined;
}

export type ContactFieldErrors = {
  rut?: string;
  phone?: string;
  email?: string;
  siteContactPhone?: string;
};

export function contactFieldErrors(input: {
  rut?: string;
  phone?: string;
  email?: string;
  siteContactPhone?: string;
}): ContactFieldErrors {
  return {
    rut: rutError(input.rut),
    phone: phoneError(input.phone),
    email: emailError(input.email),
    siteContactPhone: phoneError(input.siteContactPhone),
  };
}

export function hasFieldErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}
