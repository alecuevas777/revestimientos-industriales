import { supabase } from '@/lib/supabase';
import type { Client } from '@/types';

import { CLIENT_COLUMNS } from './columns';
import { RemoteError, remoteMessage } from './errors';
import { clientFromRow, clientToRow, type ClienteRow } from './mappers';

function chunk<T>(items: T[], size = 100) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

export async function listClients(userId: string) {
  const { data, error } = await supabase
    .from('clientes')
    .select(CLIENT_COLUMNS)
    .eq('creado_por', userId)
    .order('actualizado_en', { ascending: false });
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron cargar los clientes.'), error);
  return ((data ?? []) as ClienteRow[]).map(clientFromRow);
}

export async function listClientsByIds(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];
  const rows: ClienteRow[] = [];
  for (const group of chunk(unique)) {
    const { data, error } = await supabase.from('clientes').select(CLIENT_COLUMNS).in('id', group);
    if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron cargar los clientes.'), error);
    rows.push(...((data ?? []) as ClienteRow[]));
  }
  return rows.map(clientFromRow);
}

export async function upsertClient(client: Client, userId: string) {
  const row = clientToRow(client, userId);
  const { error } = await supabase.from('clientes').upsert(row, { onConflict: 'id' });
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudo guardar el cliente.'), error);
}

export async function deleteClient(clientId: string) {
  const { error } = await supabase.from('clientes').delete().eq('id', clientId);
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudo eliminar el cliente.'), error);
}
