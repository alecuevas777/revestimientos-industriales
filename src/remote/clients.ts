import { supabase } from '@/lib/supabase';
import type { Client } from '@/types';

import { CLIENT_COLUMNS } from './columns';
import { RemoteError, remoteMessage } from './errors';
import { clientFromRow, clientToRow, type ClienteRow } from './mappers';

export async function listClients() {
  const { data, error } = await supabase
    .from('clientes')
    .select(CLIENT_COLUMNS)
    .order('actualizado_en', { ascending: false });
  if (error) throw new RemoteError(remoteMessage(error, 'No se pudieron cargar los clientes.'), error);
  return ((data ?? []) as ClienteRow[]).map(clientFromRow);
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
