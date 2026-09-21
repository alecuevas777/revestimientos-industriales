import { isUuid } from '@/lib/id';
import { collectPhotoUris, type RemovedSurveyChildren } from '@/lib/survey';
import {
  deleteClient,
  deleteProject,
  deleteSurveyRemote,
  listClients,
  listProjects,
  listSurveysForUser,
  upsertClient,
  upsertProject,
  upsertSurveyRemote,
} from '@/remote';
import { remoteMessage } from '@/remote/errors';
import { deleteLocalPhoto } from '@/services/photoStorage';
import {
  EMPTY_WORKSPACE,
  readLegacyWorkspace,
  readWorkspaceCache,
  writeWorkspaceCache,
  type WorkspaceSnapshot,
} from '@/storage/workspaceCache';
import type { Client, Project, Survey } from '@/types';

export type PersistResult<T> = {
  value: T;
  synced: boolean;
  error?: string;
};

function byUpdatedAt<T extends { id: string; updatedAt: string }>(local: T[], remote: T[]) {
  const map = new Map<string, T>();
  for (const item of remote) map.set(item.id, item);
  for (const item of local) {
    const current = map.get(item.id);
    if (!current || item.updatedAt > current.updatedAt) map.set(item.id, item);
  }
  return [...map.values()];
}

function isOwnedBy(userId: string, createdBy?: string) {
  return createdBy === userId;
}

function keepOwnedCatalog<T extends { id: string; createdBy?: string; updatedAt: string }>(
  userId: string,
  cached: T[],
  remote: T[],
) {
  const remoteIds = new Set(remote.map((item) => item.id));
  const pending = cached.filter((item) => {
    if (remoteIds.has(item.id)) return true;
    if (!isUuid(item.id)) return true;
    return item.createdBy === userId;
  });
  return byUpdatedAt(pending, remote);
}

function referencedIds(surveys: Survey[], projects: Project[]) {
  const projectIds = new Set(surveys.map((survey) => survey.projectId));
  const clientIds = new Set(
    projects.filter((project) => projectIds.has(project.id)).map((project) => project.clientId),
  );
  return { projectIds, clientIds };
}

async function migrateLegacy(userId: string, cache: WorkspaceSnapshot): Promise<WorkspaceSnapshot> {
  if (cache.clients.length || cache.projects.length || cache.surveys.length) return cache;

  const legacy = await readLegacyWorkspace();
  const surveys = legacy.surveys.filter((survey) => survey.userId === userId);
  const { projectIds, clientIds } = referencedIds(surveys, legacy.projects);
  const projects = legacy.projects.filter(
    (project) => projectIds.has(project.id) || (isUuid(project.id) && isUuid(project.clientId)),
  );
  const clients = legacy.clients.filter(
    (client) => clientIds.has(client.id) || isUuid(client.id),
  );

  const migrated: WorkspaceSnapshot = { clients, projects, surveys };
  await writeWorkspaceCache(userId, migrated);
  return migrated;
}

function upsertItem<T extends { id: string }>(items: T[], item: T) {
  return items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [item, ...items];
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)];
}

function emptyDeletedIds() {
  return { clients: [] as string[], projects: [] as string[], surveys: [] as string[] };
}

function markDeleted(
  snapshot: WorkspaceSnapshot,
  patch: Partial<NonNullable<WorkspaceSnapshot['deletedIds']>>,
): WorkspaceSnapshot {
  const current = snapshot.deletedIds ?? emptyDeletedIds();
  return {
    ...snapshot,
    deletedIds: {
      clients: uniqueIds([...current.clients, ...(patch.clients ?? [])]),
      projects: uniqueIds([...current.projects, ...(patch.projects ?? [])]),
      surveys: uniqueIds([...current.surveys, ...(patch.surveys ?? [])]),
    },
  };
}

function withoutDeleted<T extends { id: string }>(items: T[], ids: string[] | undefined) {
  if (!ids?.length) return items;
  const blocked = new Set(ids);
  return items.filter((item) => !blocked.has(item.id));
}

async function sweepTombstones(
  deleted: NonNullable<WorkspaceSnapshot['deletedIds']>,
  remote: WorkspaceSnapshot,
): Promise<NonNullable<WorkspaceSnapshot['deletedIds']>> {
  const keep = emptyDeletedIds();

  for (const id of deleted.surveys) {
    const survey = remote.surveys.find((item) => item.id === id);
    if (!survey) continue;
    try {
      await deleteSurveyRemote(survey);
    } catch {
      keep.surveys.push(id);
    }
  }

  for (const id of deleted.projects) {
    if (!remote.projects.some((item) => item.id === id) || !isUuid(id)) continue;
    try {
      await deleteProject(id);
    } catch {
      keep.projects.push(id);
    }
  }

  for (const id of deleted.clients) {
    if (!remote.clients.some((item) => item.id === id) || !isUuid(id)) continue;
    try {
      await deleteClient(id);
    } catch {
      keep.clients.push(id);
    }
  }

  return keep;
}

async function saveSnapshot(userId: string, snapshot: WorkspaceSnapshot) {
  await writeWorkspaceCache(userId, snapshot);
  return snapshot;
}

export async function hydrateWorkspace(userId: string): Promise<{
  snapshot: WorkspaceSnapshot;
  fromCacheOnly: boolean;
  error?: string;
}> {
  const cached = await migrateLegacy(userId, await readWorkspaceCache(userId));

  try {
    const [remoteClients, remoteProjects, remoteSurveys] = await Promise.all([
      listClients(userId),
      listProjects(userId),
      listSurveysForUser(userId),
    ]);

    const deleted = cached.deletedIds ?? emptyDeletedIds();
    const kept = await sweepTombstones(deleted, {
      clients: remoteClients,
      projects: remoteProjects,
      surveys: remoteSurveys,
    });

    const projects = keepOwnedCatalog(userId, cached.projects, remoteProjects);
    const clients = keepOwnedCatalog(userId, cached.clients, remoteClients);

    const snapshot: WorkspaceSnapshot = {
      clients: withoutDeleted(clients, deleted.clients),
      projects: withoutDeleted(projects, deleted.projects),
      surveys: withoutDeleted(
        [
          ...byUpdatedAt(cached.surveys.filter((item) => isUuid(item.id)), remoteSurveys),
          ...cached.surveys.filter((item) => !isUuid(item.id)),
        ],
        deleted.surveys,
      ),
      deletedIds: kept,
    };

    await saveSnapshot(userId, snapshot);
    await pushPending(userId, snapshot, {
      clients: remoteClients,
      projects: remoteProjects,
      surveys: remoteSurveys,
    });
    return { snapshot: await readWorkspaceCache(userId), fromCacheOnly: false };
  } catch (error) {
    return {
      snapshot: cached,
      fromCacheOnly: true,
      error: remoteMessage(error, 'Sin conexión. Mostrando datos de este dispositivo.'),
    };
  }
}

async function pushPending(userId: string, local: WorkspaceSnapshot, remote: WorkspaceSnapshot) {
  const remoteClients = new Map(remote.clients.map((item) => [item.id, item]));
  const remoteProjects = new Map(remote.projects.map((item) => [item.id, item]));
  const remoteSurveys = new Map(remote.surveys.map((item) => [item.id, item]));

  for (const client of local.clients) {
    if (!isUuid(client.id) || !isOwnedBy(userId, client.createdBy)) continue;
    const remoteClient = remoteClients.get(client.id);
    if (remoteClient && remoteClient.updatedAt >= client.updatedAt) continue;
    try {
      await upsertClient(client, userId);
    } catch {
      // Offline or RLS: keep local pending.
    }
  }

  for (const project of local.projects) {
    if (!isUuid(project.id) || !isUuid(project.clientId) || !isOwnedBy(userId, project.createdBy)) continue;
    const remoteProject = remoteProjects.get(project.id);
    if (remoteProject && remoteProject.updatedAt >= project.updatedAt) continue;
    try {
      await upsertProject(project, userId);
    } catch {
      // Offline or missing parent: retry on the next save.
    }
  }

  let snapshot = local;
  for (const survey of local.surveys) {
    const remoteSurvey = remoteSurveys.get(survey.id);
    if (!isUuid(survey.id) || !isUuid(survey.projectId)) continue;
    if (remoteSurvey && remoteSurvey.updatedAt >= survey.updatedAt) continue;
    try {
      const synced = await persistSurveyTree(userId, survey);
      snapshot = {
        ...snapshot,
        surveys: upsertItem(snapshot.surveys, synced),
      };
    } catch {
      // Keep the local draft until the next sync.
    }
  }

  await saveSnapshot(userId, snapshot);
}

async function persistSurveyTree(userId: string, survey: Survey, removed?: RemovedSurveyChildren) {
  const cache = await readWorkspaceCache(userId);
  const project = cache.projects.find((item) => item.id === survey.projectId);
  const client = project ? cache.clients.find((item) => item.id === project.clientId) : undefined;
  if (client && isUuid(client.id) && isOwnedBy(userId, client.createdBy)) await upsertClient(client, userId);
  if (project && isUuid(project.id) && isUuid(project.clientId) && isOwnedBy(userId, project.createdBy)) {
    await upsertProject(project, userId);
  }
  return upsertSurveyRemote(survey, removed);
}

export async function persistClient(userId: string, client: Client): Promise<PersistResult<Client>> {
  const cache = await readWorkspaceCache(userId);
  const owned = { ...client, createdBy: client.createdBy || userId };
  await saveSnapshot(userId, { ...cache, clients: upsertItem(cache.clients, owned) });
  if (!isUuid(client.id)) {
    return { value: owned, synced: false, error: 'El cliente queda solo en este dispositivo.' };
  }
  try {
    await upsertClient(owned, userId);
    return { value: owned, synced: true };
  } catch (error) {
    return { value: owned, synced: false, error: remoteMessage(error, 'Cliente guardado en este dispositivo.') };
  }
}

export async function persistProject(userId: string, project: Project): Promise<PersistResult<Project>> {
  const cache = await readWorkspaceCache(userId);
  const owned = { ...project, createdBy: project.createdBy || userId };
  await saveSnapshot(userId, { ...cache, projects: upsertItem(cache.projects, owned) });
  if (!isUuid(project.id) || !isUuid(project.clientId)) {
    return { value: owned, synced: false, error: 'El proyecto queda solo en este dispositivo.' };
  }
  try {
    const client = cache.clients.find((item) => item.id === project.clientId);
    if (client && isUuid(client.id) && isOwnedBy(userId, client.createdBy || userId)) {
      await upsertClient({ ...client, createdBy: client.createdBy || userId }, userId);
    }
    await upsertProject(owned, userId);
    return { value: owned, synced: true };
  } catch (error) {
    return { value: owned, synced: false, error: remoteMessage(error, 'Proyecto guardado en este dispositivo.') };
  }
}

export async function persistSurvey(
  userId: string,
  survey: Survey,
  options?: { remote?: boolean; removed?: RemovedSurveyChildren },
): Promise<PersistResult<Survey>> {
  const cache = await readWorkspaceCache(userId);
  await saveSnapshot(userId, { ...cache, surveys: upsertItem(cache.surveys, survey) });
  if (options?.remote === false) {
    return { value: survey, synced: false };
  }
  if (!isUuid(survey.id) || !isUuid(survey.projectId)) {
    return { value: survey, synced: false, error: 'El levantamiento queda solo en este dispositivo.' };
  }
  try {
    const synced = await persistSurveyTree(userId, survey, options?.removed);
    const latest = await readWorkspaceCache(userId);
    await saveSnapshot(userId, { ...latest, surveys: upsertItem(latest.surveys, synced) });
    return { value: synced, synced: true };
  } catch (error) {
    return { value: survey, synced: false, error: remoteMessage(error, 'Levantamiento guardado en este dispositivo.') };
  }
}

export async function removeSurvey(userId: string, surveyId: string): Promise<PersistResult<void>> {
  const cache = await readWorkspaceCache(userId);
  const survey = cache.surveys.find((item) => item.id === surveyId);
  if (survey) {
    await Promise.all(collectPhotoUris(survey).map((uri) => deleteLocalPhoto(uri)));
  }
  await saveSnapshot(
    userId,
    markDeleted(
      { ...cache, surveys: cache.surveys.filter((item) => item.id !== surveyId) },
      { surveys: [surveyId] },
    ),
  );
  if (!survey) return { value: undefined, synced: true };
  if (!isUuid(survey.id)) return { value: undefined, synced: false };
  try {
    await deleteSurveyRemote(survey);
    return { value: undefined, synced: true };
  } catch (error) {
    return { value: undefined, synced: false, error: remoteMessage(error, 'El levantamiento se eliminó en este dispositivo.') };
  }
}

export async function removeProject(userId: string, projectId: string): Promise<PersistResult<void>> {
  const cache = await readWorkspaceCache(userId);
  const related = cache.surveys.filter((survey) => survey.projectId === projectId);
  let synced = true;
  let error: string | undefined;
  for (const survey of related) {
    const result = await removeSurvey(userId, survey.id);
    if (!result.synced) {
      synced = false;
      error = result.error;
    }
  }
  const latest = await readWorkspaceCache(userId);
  await saveSnapshot(
    userId,
    markDeleted(
      { ...latest, projects: latest.projects.filter((project) => project.id !== projectId) },
      { projects: [projectId] },
    ),
  );
  if (!isUuid(projectId)) return { value: undefined, synced: false, error };
  try {
    await deleteProject(projectId);
    return { value: undefined, synced, error };
  } catch (caught) {
    return {
      value: undefined,
      synced: false,
      error: remoteMessage(caught, 'El proyecto se eliminó en este dispositivo.'),
    };
  }
}

export async function removeClient(userId: string, clientId: string): Promise<PersistResult<void>> {
  const cache = await readWorkspaceCache(userId);
  const related = cache.projects.filter((project) => project.clientId === clientId);
  let synced = true;
  let error: string | undefined;
  for (const project of related) {
    const result = await removeProject(userId, project.id);
    if (!result.synced) {
      synced = false;
      error = result.error;
    }
  }
  const latest = await readWorkspaceCache(userId);
  await saveSnapshot(
    userId,
    markDeleted(
      { ...latest, clients: latest.clients.filter((client) => client.id !== clientId) },
      { clients: [clientId] },
    ),
  );
  if (!isUuid(clientId)) return { value: undefined, synced: false, error };
  try {
    await deleteClient(clientId);
    return { value: undefined, synced, error };
  } catch (caught) {
    return {
      value: undefined,
      synced: false,
      error: remoteMessage(caught, 'El cliente se eliminó en este dispositivo.'),
    };
  }
}
