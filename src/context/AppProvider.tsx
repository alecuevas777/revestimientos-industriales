import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthProvider';
import { createId } from '@/lib/id';
import {
  forgetWorkspace,
  markHydrated,
  rememberWorkspace,
  rememberedWorkspace,
  shouldSkipForegroundHydrate,
  shouldSkipHydrate,
} from '@/lib/hydrateGate';
import { fetchOnline, subscribeConnection } from '@/lib/connection';
import { applyPersistedSurvey, cloneSectorFields, collectPhotos, mergeRemotePhotoPaths, needsPhotoUpload, nextSurveyCode, patchSurveyPhoto, removedSurveyChildren } from '@/lib/survey';
import { clearRemovedChildren, noteRemovedChildren, peekRemovedChildren } from '@/lib/surveyDeletes';
import { emptyServiceData } from '@/lib/service';
import {
  hydrateWorkspace,
  persistClient,
  persistProject,
  persistSurvey,
  removeClient as removeClientRecord,
  removeProject as removeProjectRecord,
  removeSurvey,
} from '@/repositories/workspace';
import { deleteLocalPhoto, savePhotoLocally } from '@/services/photoStorage';
import { upsertPhotoRemote } from '@/remote';
import {
  bindPhotoUploader,
  cancelPhotoUpload,
  enqueuePendingPhotos,
  enqueuePhotoUpload,
  hasPendingPhotoUploads,
  resetPhotoUploadQueue,
  waitForPhotoUploadsIdle,
} from '@/services/photoUploadQueue';
import { emptyElement, emptySector } from '@/storage';
import type {
  Client,
  ClientDraft,
  ClientProjectSetup,
  PhotoEvidence,
  Project,
  ProjectDraft,
  ServiceType,
  Survey,
  SurveyElement,
  SurveySector,
} from '@/types';

export type ConnectionNotice = 'offline' | 'syncing' | 'synced' | null;
type HydrateMode = 'splash' | 'silent' | 'pull' | 'reconnect';

type AppDataValue = {
  ready: boolean;
  refreshing: boolean;
  clients: Client[];
  projects: Project[];
  surveys: Survey[];
  toast: string | null;
  connectionNotice: ConnectionNotice;
};

type AppActionsValue = {
  showToast: (message: string) => void;
  refreshWorkspace: () => Promise<void>;
  addClient: (draft: ClientDraft) => Promise<Client>;
  editClient: (id: string, draft: ClientDraft) => Promise<Client | null>;
  archiveClient: (id: string) => Promise<void>;
  restoreClient: (id: string) => Promise<void>;
  removeClient: (id: string) => Promise<void>;
  addProject: (draft: ProjectDraft) => Promise<Project>;
  editProject: (id: string, draft: ProjectDraft) => Promise<Project | null>;
  removeProject: (id: string) => Promise<void>;
  ensureClientAndProject: (setup: ClientProjectSetup) => Promise<{ client: Client; project: Project }>;
  startSurvey: (projectId: string, serviceType: ServiceType) => Promise<Survey>;
  saveSurvey: (survey: Pick<Survey, 'id'> & Partial<Survey>, silent?: boolean) => Promise<Survey>;
  completeSurvey: (id: string) => Promise<Survey | null>;
  reopenSurvey: (id: string) => Promise<Survey | null>;
  discardSurvey: (id: string) => Promise<void>;
  addSector: (surveyId: string) => Promise<SurveySector | null>;
  saveSector: (surveyId: string, sector: Pick<SurveySector, 'id'> & Partial<SurveySector>) => Promise<void>;
  duplicateSector: (surveyId: string, sectorId: string) => Promise<SurveySector | null>;
  removeSector: (surveyId: string, sectorId: string) => Promise<void>;
  addElement: (surveyId: string, sectorId: string) => Promise<SurveyElement | null>;
  saveElement: (surveyId: string, element: Pick<SurveyElement, 'id'> & Partial<SurveyElement>) => Promise<void>;
  removeElement: (surveyId: string, elementId: string) => Promise<void>;
  addPhoto: (input: {
    surveyId: string;
    sectorId?: string;
    elementId?: string;
    uri: string;
    category?: PhotoEvidence['category'];
  }) => Promise<PhotoEvidence | null>;
  updatePhoto: (surveyId: string, photoId: string, patch: Partial<PhotoEvidence>) => Promise<void>;
  removePhoto: (surveyId: string, photoId: string) => Promise<void>;
  retryPhotoUpload: (surveyId: string, photoId: string) => void;
  getClient: (id: string) => Client | undefined;
  getProject: (id: string) => Project | undefined;
  getSurvey: (id: string) => Survey | undefined;
};

type AppContextValue = AppDataValue & AppActionsValue;

const AppDataContext = createContext<AppDataValue | null>(null);
const AppActionsContext = createContext<AppActionsValue | null>(null);

const APP_ACTION_KEYS: (keyof AppActionsValue)[] = [
  'showToast',
  'refreshWorkspace',
  'addClient',
  'editClient',
  'archiveClient',
  'restoreClient',
  'removeClient',
  'addProject',
  'editProject',
  'removeProject',
  'ensureClientAndProject',
  'startSurvey',
  'saveSurvey',
  'completeSurvey',
  'reopenSurvey',
  'discardSurvey',
  'addSector',
  'saveSector',
  'duplicateSector',
  'removeSector',
  'addElement',
  'saveElement',
  'removeElement',
  'addPhoto',
  'updatePhoto',
  'removePhoto',
  'retryPhotoUpload',
  'getClient',
  'getProject',
  'getSurvey',
];

function savedToast(synced: boolean, online = 'Guardado') {
  return synced ? online : 'Guardado en este dispositivo';
}

function hasPendingLocalWork(surveys: Survey[], pendingSurveyIds: Set<string>) {
  if (pendingSurveyIds.size > 0) return true;
  if (hasPendingPhotoUploads()) return true;
  return surveys.some((survey) => collectPhotos(survey).some(needsPhotoUpload));
}

function buildClient(draft: ClientDraft, userId: string): Client {
  const now = new Date().toISOString();
  return {
    ...draft,
    id: createId(),
    createdBy: userId,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

function buildProject(draft: ProjectDraft, userId: string): Project {
  const now = new Date().toISOString();
  return {
    ...draft,
    id: createId(),
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const remembered = session ? rememberedWorkspace(session.id) : null;
  const [ready, setReady] = useState(() => Boolean(remembered));
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<Client[]>(() => remembered?.clients ?? []);
  const [projects, setProjects] = useState<Project[]>(() => remembered?.projects ?? []);
  const [surveys, setSurveys] = useState<Survey[]>(() => remembered?.surveys ?? []);
  const [toast, setToast] = useState<string | null>(null);
  const [connectionNotice, setConnectionNotice] = useState<ConnectionNotice>(null);
  const surveysRef = useRef<Survey[]>([]);
  const clientsRef = useRef<Client[]>([]);
  const projectsRef = useRef<Project[]>([]);
  const sessionRef = useRef(session);
  const hydratingRef = useRef(false);
  const pendingHydrateRef = useRef(false);
  const reconnectPendingRef = useRef(false);
  const persistTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const persistChains = useRef(new Map<string, Promise<void>>());
  const pendingRemote = useRef(new Set<string>());
  const cancelledSurveys = useRef(new Set<string>());
  const hydrateRef = useRef<(userId: string, mode: HydrateMode) => Promise<void>>(async () => {});
  const flushAllRef = useRef<() => Promise<void>>(async () => {});
  const reconnectRef = useRef<() => Promise<void>>(async () => {});
  const actionsRef = useRef<AppActionsValue>(null!);
  const readyRef = useRef(ready);
  const onlineRef = useRef(true);
  const unsyncedRef = useRef(false);
  const reconnectingRef = useRef(false);
  const reconnectFailedRef = useRef(false);
  const syncedNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  surveysRef.current = surveys;
  clientsRef.current = clients;
  projectsRef.current = projects;
  sessionRef.current = session;
  readyRef.current = ready;

  useEffect(() => {
    if (!session) {
      persistTimers.current.forEach((timer) => clearTimeout(timer));
      persistTimers.current.clear();
      pendingRemote.current.clear();
      resetPhotoUploadQueue();
      forgetWorkspace();
      unsyncedRef.current = false;
      reconnectingRef.current = false;
      setClients([]);
      setProjects([]);
      setSurveys([]);
      setRefreshing(false);
      setReady(true);
      return;
    }

    const userId = session.id;
    void hydrateRef.current(userId, readyRef.current ? 'silent' : 'splash');

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        void flushAllRef.current();
        return;
      }
      if (state === 'active') {
        void hydrateRef.current(userId, 'silent');
      }
    });

    return () => {
      appState.remove();
    };
  }, [session?.id]);

  useEffect(() => {
    let mounted = true;
    void fetchOnline().then((value) => {
      if (!mounted) return;
      onlineRef.current = value;
      if (!value) setConnectionNotice('offline');
    });

    const unsubscribe = subscribeConnection((value) => {
      const wasOnline = onlineRef.current;
      onlineRef.current = value;
      if (!value) {
        reconnectingRef.current = false;
        setConnectionNotice('offline');
        return;
      }
      if (wasOnline) return;
      void reconnectRef.current();
    });

    return () => {
      mounted = false;
      unsubscribe();
      if (syncedNoticeTimer.current) clearTimeout(syncedNoticeTimer.current);
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  function noteUnsynced() {
    unsyncedRef.current = true;
  }

  function noteSyncResult(synced: boolean) {
    if (!synced) noteUnsynced();
  }

  function noteWrite() {
    if (!onlineRef.current) noteUnsynced();
  }

  async function saveClient(userId: string, client: Client) {
    noteWrite();
    const result = await persistClient(userId, client);
    noteSyncResult(result.synced);
    return result;
  }

  async function saveProject(userId: string, project: Project) {
    noteWrite();
    const result = await persistProject(userId, project);
    noteSyncResult(result.synced);
    return result;
  }

  function requireUserId() {
    const current = sessionRef.current;
    if (!current) {
      throw new Error('Debes iniciar sesión para guardar datos.');
    }
    return current.id;
  }

  function writeSurveyMemory(next: Survey) {
    const current = surveysRef.current;
    const existing = current.find((item) => item.id === next.id);
    const merged = existing ? mergeRemotePhotoPaths(next, existing) : next;
    surveysRef.current = existing
      ? current.map((item) => (item.id === next.id ? merged : item))
      : [merged, ...current];
    return merged;
  }

  function publishSurveys() {
    setSurveys(surveysRef.current);
  }

  function replaceSurvey(next: Survey) {
    writeSurveyMemory(next);
    publishSurveys();
  }

  function applyPhotoPatch(surveyId: string, photoId: string, patch: Partial<PhotoEvidence>) {
    const current = surveysRef.current.find((item) => item.id === surveyId);
    if (!current) return;
    const next = patchSurveyPhoto(current, photoId, patch);
    replaceSurvey(next);
    if (patch.uploadStatus === 'error' || patch.uploadStatus === 'pending') noteUnsynced();
    const userId = sessionRef.current?.id;
    if (userId) void persistSurvey(userId, surveysRef.current.find((item) => item.id === surveyId) ?? next, { remote: false });
  }

  bindPhotoUploader({
    getUserId: () => sessionRef.current?.id,
    getPhoto: (surveyId, photoId) => {
      const survey = surveysRef.current.find((item) => item.id === surveyId);
      return survey ? collectPhotos(survey).find((photo) => photo.id === photoId) : undefined;
    },
    onPatch: applyPhotoPatch,
    ensureRemote: async (surveyId) => {
      await runRemotePersist(surveyId, true);
    },
  });

  function applyPersisted(result: Survey) {
    const local = surveysRef.current.find((item) => item.id === result.id);
    replaceSurvey(applyPersistedSurvey(local, result));
  }

  async function runRemotePersist(surveyId: string, silent?: boolean) {
    const timer = persistTimers.current.get(surveyId);
    if (timer) {
      clearTimeout(timer);
      persistTimers.current.delete(surveyId);
    }
    pendingRemote.current.delete(surveyId);

    const previous = persistChains.current.get(surveyId) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(async () => {
      if (cancelledSurveys.current.has(surveyId)) return;
      const latest = surveysRef.current.find((item) => item.id === surveyId);
      const userId = sessionRef.current?.id;
      if (!latest || !userId) return;
      const result = await persistSurvey(userId, latest, {
        removed: peekRemovedChildren(surveyId),
      });
      if (cancelledSurveys.current.has(surveyId)) return;
      if (result.synced) clearRemovedChildren(surveyId);
      applyPersisted(result.value);
      const uploaded = surveysRef.current.find((item) => item.id === surveyId);
      if (uploaded) enqueuePendingPhotos([uploaded]);
      noteSyncResult(result.synced);
      if (!silent) showToast(savedToast(result.synced));
    });
    persistChains.current.set(surveyId, next);
    await next;
  }

  async function flushAllSurveys() {
    const ids = new Set([...pendingRemote.current, ...persistChains.current.keys()]);
    await Promise.all([...ids].map((id) => runRemotePersist(id, true)));
    publishSurveys();
  }

  flushAllRef.current = flushAllSurveys;
  reconnectRef.current = async () => {
    if (reconnectingRef.current) return;
    const userId = sessionRef.current?.id;
    const hadWork = unsyncedRef.current || hasPendingLocalWork(surveysRef.current, pendingRemote.current);

    if (!userId) {
      setConnectionNotice(null);
      return;
    }

    if (!hadWork) {
      setConnectionNotice(null);
      void hydrateRef.current(userId, 'silent');
      return;
    }

    reconnectingRef.current = true;
    reconnectFailedRef.current = false;
    setConnectionNotice('syncing');
    try {
      const started = Date.now();
      while ((hydratingRef.current || shouldSkipHydrate()) && Date.now() - started < 8000) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      await hydrateRef.current(userId, 'reconnect');
      await waitForPhotoUploadsIdle();
      if (!onlineRef.current || reconnectFailedRef.current) {
        setConnectionNotice('offline');
        return;
      }
      unsyncedRef.current = false;
      setConnectionNotice('synced');
      if (syncedNoticeTimer.current) clearTimeout(syncedNoticeTimer.current);
      syncedNoticeTimer.current = setTimeout(() => {
        setConnectionNotice((current) => (current === 'synced' ? null : current));
        syncedNoticeTimer.current = null;
      }, 2800);
    } finally {
      reconnectingRef.current = false;
    }
  };
  hydrateRef.current = async (userId, mode) => {
    if (mode === 'silent' && shouldSkipForegroundHydrate()) return;
    if (hydratingRef.current) {
      pendingHydrateRef.current = true;
      if (mode === 'reconnect') reconnectPendingRef.current = true;
      return;
    }
    hydratingRef.current = true;
    if (mode === 'splash' && !readyRef.current) setReady(false);
    if (mode === 'pull') setRefreshing(true);
    try {
      await flushAllSurveys();
      const result = await hydrateWorkspace(userId);
      if (sessionRef.current?.id !== userId) return;
      setClients(result.snapshot.clients);
      setProjects(result.snapshot.projects);
      surveysRef.current = result.snapshot.surveys;
      setSurveys(result.snapshot.surveys);
      rememberWorkspace({
        userId,
        clients: result.snapshot.clients,
        projects: result.snapshot.projects,
        surveys: result.snapshot.surveys,
      });
      markHydrated();
      enqueuePendingPhotos(result.snapshot.surveys);
      if (result.fromCacheOnly && mode === 'reconnect') {
        reconnectFailedRef.current = true;
      }
    } finally {
      hydratingRef.current = false;
      if (mode === 'pull') setRefreshing(false);
      if (sessionRef.current?.id === userId) setReady(true);
      if (pendingHydrateRef.current && sessionRef.current?.id === userId && !shouldSkipHydrate()) {
        pendingHydrateRef.current = false;
        const nextMode: HydrateMode = reconnectPendingRef.current ? 'reconnect' : 'silent';
        reconnectPendingRef.current = false;
        void hydrateRef.current(userId, nextMode);
      }
    }
  };

  async function commitSurvey(survey: Survey, options?: { silent?: boolean; flush?: boolean }) {
    const userId = requireUserId();
    noteWrite();
    const silent = options?.silent ?? false;
    const flush = options?.flush ?? true;
    const stamped = { ...survey, updatedAt: new Date().toISOString() };
    const previous = surveysRef.current.find((item) => item.id === stamped.id);
    noteRemovedChildren(stamped.id, removedSurveyChildren(previous, stamped));
    writeSurveyMemory(stamped);

    if (flush) {
      publishSurveys();
      await persistSurvey(userId, stamped, { remote: false });
      await runRemotePersist(stamped.id, silent);
    } else {
      pendingRemote.current.add(stamped.id);
      const existing = persistTimers.current.get(stamped.id);
      if (existing) clearTimeout(existing);
      persistTimers.current.set(
        stamped.id,
        setTimeout(() => {
          publishSurveys();
          void runRemotePersist(stamped.id, silent);
        }, 500),
      );
    }
    return surveysRef.current.find((item) => item.id === stamped.id) ?? stamped;
  }

  async function dropSurveyState(id: string) {
    cancelledSurveys.current.add(id);
    clearRemovedChildren(id);
    const timer = persistTimers.current.get(id);
    if (timer) clearTimeout(timer);
    persistTimers.current.delete(id);
    pendingRemote.current.delete(id);
    await (persistChains.current.get(id) ?? Promise.resolve()).catch(() => undefined);
    const survey = surveysRef.current.find((item) => item.id === id);
    if (survey) {
      for (const photo of collectPhotos(survey)) cancelPhotoUpload(photo.id);
    }
  }

  const actions: AppActionsValue = {
      showToast,
      refreshWorkspace: async () => {
        const userId = sessionRef.current?.id;
        if (!userId) return;
        await hydrateRef.current(userId, 'pull');
      },
      addClient: async (draft) => {
        const userId = requireUserId();
        const client = buildClient(draft, userId);
        const result = await saveClient(userId, client);
        setClients((current) => [result.value, ...current]);
        showToast(savedToast(result.synced, 'Cliente guardado'));
        return result.value;
      },
      editClient: async (id, draft) => {
        const userId = requireUserId();
        const current = clientsRef.current.find((item) => item.id === id);
        if (!current) return null;
        const client: Client = { ...current, ...draft, updatedAt: new Date().toISOString() };
        const result = await saveClient(userId, client);
        setClients((list) => list.map((item) => (item.id === id ? result.value : item)));
        showToast(savedToast(result.synced, 'Cambios guardados'));
        return result.value;
      },
      archiveClient: async (id) => {
        const userId = requireUserId();
        const current = clientsRef.current.find((item) => item.id === id);
        if (!current) return;
        const client: Client = {
          ...current,
          archived: true,
          archivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const result = await saveClient(userId, client);
        setClients((list) => list.map((item) => (item.id === id ? result.value : item)));
        showToast(result.synced ? 'Cliente archivado' : 'Cliente archivado en este dispositivo');
      },
      restoreClient: async (id) => {
        const userId = requireUserId();
        const current = clientsRef.current.find((item) => item.id === id);
        if (!current) return;
        const client: Client = {
          ...current,
          archived: false,
          archivedAt: undefined,
          updatedAt: new Date().toISOString(),
        };
        const result = await saveClient(userId, client);
        setClients((list) => list.map((item) => (item.id === id ? result.value : item)));
        showToast(result.synced ? 'Cliente restaurado' : 'Cliente restaurado en este dispositivo');
      },
      removeClient: async (id) => {
        const userId = requireUserId();
        const projectIds = new Set(
          projectsRef.current.filter((project) => project.clientId === id).map((project) => project.id),
        );
        const related = surveysRef.current.filter((survey) => projectIds.has(survey.projectId));
        for (const survey of related) {
          await dropSurveyState(survey.id);
        }
        const result = await removeClientRecord(userId, id);
        noteSyncResult(result.synced);
        if (!result.synced) noteWrite();
        setSurveys((list) => list.filter((survey) => !projectIds.has(survey.projectId)));
        setProjects((list) => list.filter((project) => project.clientId !== id));
        setClients((list) => list.filter((client) => client.id !== id));
        showToast(result.synced ? 'Cliente eliminado' : 'Cliente eliminado en este dispositivo');
      },
      addProject: async (draft) => {
        const userId = requireUserId();
        const project = buildProject(draft, userId);
        const result = await saveProject(userId, project);
        setProjects((current) => [result.value, ...current]);
        showToast(savedToast(result.synced, 'Proyecto guardado'));
        return result.value;
      },
      editProject: async (id, draft) => {
        const userId = requireUserId();
        const current = projectsRef.current.find((item) => item.id === id);
        if (!current) return null;
        const project: Project = { ...current, ...draft, updatedAt: new Date().toISOString() };
        const result = await saveProject(userId, project);
        setProjects((list) => list.map((item) => (item.id === id ? result.value : item)));
        showToast(savedToast(result.synced, 'Cambios guardados'));
        return result.value;
      },
      removeProject: async (id) => {
        const userId = requireUserId();
        const related = surveysRef.current.filter((survey) => survey.projectId === id);
        for (const survey of related) {
          await dropSurveyState(survey.id);
        }
        const result = await removeProjectRecord(userId, id);
        noteSyncResult(result.synced);
        setSurveys((list) => list.filter((survey) => survey.projectId !== id));
        setProjects((list) => list.filter((project) => project.id !== id));
        showToast(result.synced ? 'Proyecto eliminado' : 'Proyecto eliminado en este dispositivo');
      },
      ensureClientAndProject: async (setup) => {
        const userId = requireUserId();
        let client = setup.clientId ? clientsRef.current.find((item) => item.id === setup.clientId) : undefined;
        if (!client && setup.client) {
          const created = await saveClient(userId, buildClient(setup.client, userId));
          client = created.value;
          setClients((current) => [client!, ...current]);
        }
        if (!client) {
          throw new Error('Falta el cliente para crear el proyecto.');
        }
        const createdProject = await saveProject(userId, buildProject({ ...setup.project, clientId: client.id }, userId));
        setProjects((current) => [createdProject.value, ...current]);
        showToast(savedToast(createdProject.synced, setup.clientId ? 'Proyecto listo para el levantamiento' : 'Cliente y proyecto listos'));
        return { client, project: createdProject.value };
      },
      startSurvey: async (projectId, serviceType) => {
        const userId = requireUserId();
        const now = new Date().toISOString();
        const survey: Survey = {
          id: createId(),
          code: nextSurveyCode(surveysRef.current),
          projectId,
          userId,
          serviceType,
          status: 'draft',
          startedAt: now,
          updatedAt: now,
          serviceData: emptyServiceData(serviceType),
          sectors: [],
          photos: [],
        };
        return commitSurvey(survey, { silent: true });
      },
      saveSurvey: async (survey, silent) => {
        const current = surveysRef.current.find((item) => item.id === survey.id) ?? (survey as Survey);
        return commitSurvey({ ...current, ...survey, id: current.id }, { silent, flush: !silent });
      },
      completeSurvey: async (id) => {
        const userId = requireUserId();
        noteWrite();
        const current = surveysRef.current.find((item) => item.id === id);
        if (!current) return null;
        const now = new Date().toISOString();
        const stamped: Survey = {
          ...current,
          status: 'completed',
          completedAt: now,
          updatedAt: now,
        };
        noteRemovedChildren(stamped.id, removedSurveyChildren(current, stamped));
        writeSurveyMemory(stamped);
        publishSurveys();
        await persistSurvey(userId, stamped, { remote: false });
        pendingRemote.current.add(stamped.id);
        void runRemotePersist(stamped.id, true);
        return stamped;
      },
      reopenSurvey: async (id) => {
        const current = surveysRef.current.find((item) => item.id === id);
        if (!current) return null;
        return commitSurvey(
          {
            ...current,
            status: 'draft',
            completedAt: undefined,
            updatedAt: new Date().toISOString(),
          },
          { silent: true },
        );
      },
      discardSurvey: async (id) => {
        const userId = requireUserId();
        await dropSurveyState(id);
        const result = await removeSurvey(userId, id);
        noteSyncResult(result.synced);
        setSurveys((current) => current.filter((item) => item.id !== id));
        showToast('Levantamiento eliminado');
      },
      addSector: async (surveyId) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return null;
        const sector = emptySector(surveyId);
        await commitSurvey({ ...current, sectors: [...current.sectors, sector] }, { silent: true });
        return sector;
      },
      saveSector: async (surveyId, sector) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        const existing = current.sectors.find((item) => item.id === sector.id);
        if (!existing) return;
        const nextSector = {
          ...existing,
          ...sector,
          id: existing.id,
          surveyId: existing.surveyId,
          updatedAt: new Date().toISOString(),
        };
        await commitSurvey(
          {
            ...current,
            sectors: current.sectors.map((item) => (item.id === sector.id ? nextSector : item)),
          },
          { silent: true, flush: false },
        );
      },
      duplicateSector: async (surveyId, sectorId) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        const source = current?.sectors.find((item) => item.id === sectorId);
        if (!current || !source) return null;
        const copy: SurveySector = {
          ...emptySector(surveyId),
          ...cloneSectorFields(source),
          name: source.name.trim() ? `${source.name} (copia)` : '',
        };
        await commitSurvey({ ...current, sectors: [...current.sectors, copy] }, { silent: true });
        return copy;
      },
      removeSector: async (surveyId, sectorId) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        const sector = current.sectors.find((item) => item.id === sectorId);
        if (sector) {
          const uris = [...sector.photos, ...sector.elements.flatMap((element) => element.photos)].map((photo) => photo.uri);
          await Promise.all(uris.map((uri) => deleteLocalPhoto(uri)));
        }
        await commitSurvey(
          {
            ...current,
            sectors: current.sectors.filter((item) => item.id !== sectorId),
          },
          { silent: true },
        );
      },
      addElement: async (surveyId, sectorId) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return null;
        const element = emptyElement(surveyId, sectorId, current.serviceType);
        await commitSurvey(
          {
            ...current,
            sectors: current.sectors.map((sector) =>
              sector.id === sectorId ? { ...sector, elements: [...sector.elements, element] } : sector,
            ),
          },
          { silent: true },
        );
        return element;
      },
      saveElement: async (surveyId, element) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        const now = new Date().toISOString();
        await commitSurvey(
          {
            ...current,
            sectors: current.sectors.map((sector) => ({
              ...sector,
              elements: sector.elements.map((item) =>
                item.id === element.id ? { ...item, ...element, id: item.id, updatedAt: now } : item,
              ),
            })),
          },
          { silent: true, flush: false },
        );
      },
      removeElement: async (surveyId, elementId) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        const element = current.sectors.flatMap((sector) => sector.elements).find((item) => item.id === elementId);
        if (element) {
          await Promise.all(element.photos.map((photo) => deleteLocalPhoto(photo.uri)));
        }
        await commitSurvey(
          {
            ...current,
            sectors: current.sectors.map((sector) => ({
              ...sector,
              elements: sector.elements.filter((item) => item.id !== elementId),
            })),
          },
          { silent: true },
        );
      },
      addPhoto: async ({ surveyId, sectorId, elementId, uri, category = 'overview' }) => {
        const userId = requireUserId();
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return null;
        const localUri = await savePhotoLocally(uri);
        const photo: PhotoEvidence = {
          id: createId(),
          uri: localUri,
          surveyId,
          sectorId,
          elementId,
          category,
          uploadStatus: 'pending',
          createdAt: new Date().toISOString(),
        };

        if (elementId && sectorId) {
          await commitSurvey(
            {
              ...current,
              sectors: current.sectors.map((sector) =>
                sector.id === sectorId
                  ? {
                      ...sector,
                      elements: sector.elements.map((element) =>
                        element.id === elementId ? { ...element, photos: [...element.photos, photo] } : element,
                      ),
                    }
                  : sector,
              ),
            },
            { silent: true, flush: false },
          );
        } else if (sectorId) {
          await commitSurvey(
            {
              ...current,
              sectors: current.sectors.map((sector) =>
                sector.id === sectorId ? { ...sector, photos: [...sector.photos, photo] } : sector,
              ),
            },
            { silent: true, flush: false },
          );
        } else {
          await commitSurvey({ ...current, photos: [...current.photos, photo] }, { silent: true, flush: false });
        }
        publishSurveys();
        const stored = surveysRef.current.find((item) => item.id === surveyId) ?? current;
        await persistSurvey(userId, stored, { remote: false });
        enqueuePhotoUpload(surveyId, photo.id);
        return photo;
      },
      updatePhoto: async (surveyId, photoId, patch) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        await commitSurvey(patchSurveyPhoto(current, photoId, patch), { silent: true, flush: false });
        const latest = collectPhotos(surveysRef.current.find((item) => item.id === surveyId) ?? current).find(
          (photo) => photo.id === photoId,
        );
        if (latest) {
          if (latest.storagePath) {
            void upsertPhotoRemote({ ...latest, category: latest.category ?? 'overview' }).catch(() => undefined);
          } else {
            enqueuePhotoUpload(surveyId, photoId);
          }
        }
      },
      removePhoto: async (surveyId, photoId) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        cancelPhotoUpload(photoId);
        const all = collectPhotos(current);
        const photo = all.find((item) => item.id === photoId);
        if (photo) await deleteLocalPhoto(photo.uri);
        await commitSurvey(
          {
            ...current,
            photos: current.photos.filter((item) => item.id !== photoId),
            sectors: current.sectors.map((sector) => ({
              ...sector,
              photos: sector.photos.filter((item) => item.id !== photoId),
              elements: sector.elements.map((element) => ({
                ...element,
                photos: element.photos.filter((item) => item.id !== photoId),
              })),
            })),
          },
          { silent: true },
        );
      },
      retryPhotoUpload: (surveyId, photoId) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        const photo = collectPhotos(current).find((item) => item.id === photoId);
        if (!photo || photo.storagePath) return;
        applyPhotoPatch(surveyId, photoId, { uploadStatus: 'pending' });
        enqueuePhotoUpload(surveyId, photoId);
      },
      getClient: (id) => clientsRef.current.find((item) => item.id === id),
      getProject: (id) => projectsRef.current.find((item) => item.id === id),
      getSurvey: (id) => surveysRef.current.find((item) => item.id === id),
  };
  actionsRef.current = actions;

  const dataValue = useMemo<AppDataValue>(
    () => ({ ready, refreshing, clients, projects, surveys, toast, connectionNotice }),
    [ready, refreshing, clients, projects, surveys, toast, connectionNotice],
  );

  const stableActions = useMemo(() => {
    const bag = {} as AppActionsValue;
    for (const key of APP_ACTION_KEYS) {
      Object.defineProperty(bag, key, {
        configurable: true,
        enumerable: true,
        get: () => actionsRef.current[key],
      });
    }
    return bag;
  }, []);

  return (
    <AppActionsContext.Provider value={stableActions}>
      <AppDataContext.Provider value={dataValue}>
        <View className="flex-1">
          {children}
          {toast ? (
            <View className="absolute bottom-8 left-5 right-5 z-50 items-center" pointerEvents="none">
              <View className="rounded-full bg-ink px-4 py-3">
                <Text className="text-sm font-medium text-white">{toast}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </AppDataContext.Provider>
    </AppActionsContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function useAppActions() {
  const context = useContext(AppActionsContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function useApp(): AppContextValue {
  const data = useAppData();
  const actions = useAppActions();
  return { ...data, ...actions };
}
