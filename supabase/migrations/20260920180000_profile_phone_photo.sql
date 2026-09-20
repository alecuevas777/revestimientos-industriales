-- Ficha del técnico: teléfono y foto de perfil (Storage: fotos/{uid}/perfil/avatar.jpg)

alter table public.perfiles
  add column if not exists telefono text,
  add column if not exists foto_path text;
