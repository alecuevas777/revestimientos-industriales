import { isUuid } from '@/lib/id';
import { collectPhotoUris, type RemovedSurveyChildren } from '@/lib/survey';
import { deleteSurveyRemote, listClients, listProjects, listSurveysForUser, upsertClient, upsertProject, upsertSurveyRemote } from '@/remote';
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

function referencedIds(surveys: Survey[], projects: Project[]) {
  const projectIds = new Set(surveys.map((survey) => survey.projectId));
  const clientIds = new Set(
    projects.filter((project) => projectIds.has(project.id)).map((project) => project.clientId),
  );
  return { projectIds, clientIds };
}

async function migrateLegacy(userId: string, cache: WorkspaceSnapshot) {
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

  const migrated = { clients, projects, surveys };
  await writeWorkspaceCache(userId, migrated);
  return migrated;
}

function upsertItem<T extends { id: string }>(items: T[], item: T) {
  return items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [item, ...items];
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
      listClients(),
      listProjects(),
      listSurveysForUser(userId),
    ]);

    const snapshot: WorkspaceSnapshot = {
      clients: [
        ...byUpdatedAt(cached.clients.filter((item) => isUuid(item.id)), remoteClients),
        ...cached.clients.filter((item) => !isUuid(item.id)),
      ],
      projects: [
        ...byUpdatedAt(cached.projects.filter((item) => isUuid(item.id)), remoteProjects),
        ...cached.projects.filter((item) => !isUuid(item.id)),
      ],
      surveys: [
        ...byUpdatedAt(cached.surveys.filter((item) => isUuid(item.id)), remoteSurveys),
        ...cached.surveys.filter((item) => !isUuid(item.id)),
      ],
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
    if (!isUuid(client.id)) continue;
    const remoteClient = remoteClients.get(client.id);
    if (remoteClient && remoteClient.updatedAt >= client.updatedAt) continue;
    try {
      await upsertClient(client, userId);
    } catch {
      // Offline or RLS: keep local pending.
    }
  }

  for (const project of local.projects) {
    if (!isUuid(project.id) || !isUuid(project.clientId)) continue;
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
  if (client && isUuid(client.id)) await upsertClient(client, userId);
  if (project && isUuid(project.id) && isUuid(project.clientId)) await upsertProject(project, userId);
  return upsertSurveyRemote(survey, removed);
}

export async function persistClient(userId: string, client: Client): Promise<PersistResult<Client>> {
  const cache = await readWorkspaceCache(userId);
  await saveSnapshot(userId, { ...cache, clients: upsertItem(cache.clients, client) });
  if (!isUuid(client.id)) {
    return { value: client, synced: false, error: 'El cliente queda solo en este dispositivo.' };
  }
  try {
    await upsertClient(client, userId);
    return { value: client, synced: true };
  } catch (error) {
    return { value: client, synced: false, error: remoteMessage(error, 'Cliente guardado en este dispositivo.') };
  }
}

export async function persistProject(userId: string, project: Project): Promise<PersistResult<Project>> {
  const cache = await readWorkspaceCache(userId);
  await saveSnapshot(userId, { ...cache, projects: upsertItem(cache.projects, project) });
  if (!isUuid(project.id) || !isUuid(project.clientId)) {
    return { value: project, synced: false, error: 'El proyecto queda solo en este dispositivo.' };
  }
  try {
    const client = cache.clients.find((item) => item.id === project.clientId);
    if (client && isUuid(client.id)) await upsertClient(client, userId);
    await upsertProject(project, userId);
    return { value: project, synced: true };
  } catch (error) {
    return { value: project, synced: false, error: remoteMessage(error, 'Proyecto guardado en este dispositivo.') };
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
  await saveSnapshot(userId, { ...cache, surveys: cache.surveys.filter((item) => item.id !== surveyId) });
  if (!survey) return { value: undefined, synced: true };
  if (!isUuid(survey.id)) return { value: undefined, synced: false };
  try {
    await deleteSurveyRemote(survey);
    return { value: undefined, synced: true };
  } catch (error) {
    return { value: undefined, synced: false, error: remoteMessage(error, 'El levantamiento se eliminó en este dispositivo.') };
  }
}
