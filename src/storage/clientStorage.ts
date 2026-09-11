import { STORAGE_KEYS } from '@/constants/storageKeys';
import { createId } from '@/lib/id';
import type { Client, ClientDraft } from '@/types';

import { readJson, writeJson } from './json';

export async function getClients() {
  return readJson<Client[]>(STORAGE_KEYS.clients, []);
}

export async function saveClients(clients: Client[]) {
  await writeJson(STORAGE_KEYS.clients, clients);
}

export async function createClient(draft: ClientDraft) {
  const clients = await getClients();
  const now = new Date().toISOString();
  const client: Client = {
    ...draft,
    id: createId('cli'),
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  await saveClients([client, ...clients]);
  return client;
}

export async function updateClient(id: string, draft: Partial<Client>) {
  const clients = await getClients();
  const next = clients.map((client) =>
    client.id === id ? { ...client, ...draft, updatedAt: new Date().toISOString() } : client,
  );
  await saveClients(next);
  return next.find((client) => client.id === id) ?? null;
}

export async function archiveClient(id: string) {
  return updateClient(id, {
    archived: true,
    archivedAt: new Date().toISOString(),
  });
}
