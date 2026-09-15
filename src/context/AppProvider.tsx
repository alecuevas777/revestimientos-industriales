import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { DEMO_PASSWORD, DEMO_USER } from '@/constants/labels';
import { createId } from '@/lib/id';
import { cloneSectorFields, collectPhotos, nextSurveyCode } from '@/lib/survey';
import { deleteLocalPhoto, savePhotoLocally } from '@/services/photoStorage';
import { emptyServiceData } from '@/lib/service';
import {
  archiveClient as archiveClientRecord,
  clearSession,
  createClient,
  createProject,
  deleteSurvey,
  emptyElement,
  emptySector,
  loadAppData,
  resetDemoData as resetStoredDemo,
  saveSession,
  updateClient,
  updateProject,
  upsertSurvey,
} from '@/storage';
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
  User,
} from '@/types';

type AppContextValue = {
  ready: boolean;
  session: User | null;
  clients: Client[];
  projects: Project[];
  surveys: Survey[];
  toast: string | null;
  showToast: (message: string) => void;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  addClient: (draft: ClientDraft) => Promise<Client>;
  editClient: (id: string, draft: ClientDraft) => Promise<Client | null>;
  archiveClient: (id: string) => Promise<void>;
  addProject: (draft: ProjectDraft) => Promise<Project>;
  editProject: (id: string, draft: ProjectDraft) => Promise<Project | null>;
  ensureClientAndProject: (setup: ClientProjectSetup) => Promise<{ client: Client; project: Project }>;
  startSurvey: (projectId: string, serviceType: ServiceType) => Promise<Survey>;
  saveSurvey: (survey: Survey, silent?: boolean) => Promise<Survey>;
  completeSurvey: (id: string) => Promise<Survey | null>;
  discardSurvey: (id: string) => Promise<void>;
  addSector: (surveyId: string) => Promise<SurveySector | null>;
  saveSector: (surveyId: string, sector: SurveySector) => Promise<void>;
  duplicateSector: (surveyId: string, sectorId: string) => Promise<SurveySector | null>;
  removeSector: (surveyId: string, sectorId: string) => Promise<void>;
  addElement: (surveyId: string, sectorId: string) => Promise<SurveyElement | null>;
  saveElement: (surveyId: string, element: SurveyElement) => Promise<void>;
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
  resetDemoData: () => Promise<void>;
  getClient: (id: string) => Client | undefined;
  getProject: (id: string) => Project | undefined;
  getSurvey: (id: string) => Survey | undefined;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const surveysRef = useRef<Survey[]>([]);
  surveysRef.current = surveys;

  useEffect(() => {
    loadAppData()
      .then((data) => {
        setSession(data.session);
        setClients(data.clients);
        setProjects(data.projects);
        setSurveys(data.surveys);
      })
      .finally(() => setReady(true));
  }, []);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  function replaceSurvey(next: Survey) {
    setSurveys((current) => {
      const exists = current.some((item) => item.id === next.id);
      return exists ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current];
    });
  }

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      session,
      clients,
      projects,
      surveys,
      toast,
      showToast,
      login: async (email, password) => {
        if (email.trim().toLowerCase() !== DEMO_USER.email || password !== DEMO_PASSWORD) {
          return 'Email o contraseña incorrectos.';
        }
        const user: User = { ...DEMO_USER };
        await saveSession(user);
        setSession(user);
        return null;
      },
      logout: async () => {
        await clearSession();
        setSession(null);
      },
      addClient: async (draft) => {
        const client = await createClient(draft);
        setClients((current) => [client, ...current]);
        showToast('Cliente guardado en este dispositivo');
        return client;
      },
      editClient: async (id, draft) => {
        const client = await updateClient(id, draft);
        if (client) {
          setClients((current) => current.map((item) => (item.id === id ? client : item)));
          showToast('Cambios guardados en este dispositivo');
        }
        return client;
      },
      archiveClient: async (id) => {
        const client = await archiveClientRecord(id);
        if (client) {
          setClients((current) => current.map((item) => (item.id === id ? client : item)));
          showToast('Cliente archivado');
        }
      },
      addProject: async (draft) => {
        const project = await createProject(draft);
        setProjects((current) => [project, ...current]);
        showToast('Proyecto guardado en este dispositivo');
        return project;
      },
      editProject: async (id, draft) => {
        const project = await updateProject(id, draft);
        if (project) {
          setProjects((current) => current.map((item) => (item.id === id ? project : item)));
          showToast('Cambios guardados en este dispositivo');
        }
        return project;
      },
      ensureClientAndProject: async (setup) => {
        let client = setup.clientId ? clients.find((item) => item.id === setup.clientId) : undefined;
        if (!client && setup.client) {
          client = await createClient(setup.client);
          setClients((current) => [client!, ...current]);
        }
        if (!client) {
          throw new Error('Falta el cliente para crear el proyecto.');
        }
        const project = await createProject({ ...setup.project, clientId: client.id });
        setProjects((current) => [project, ...current]);
        showToast(setup.clientId ? 'Proyecto listo para el levantamiento' : 'Cliente y proyecto listos');
        return { client, project };
      },
      startSurvey: async (projectId, serviceType) => {
        const now = new Date().toISOString();
        const survey: Survey = {
          id: createId('srv'),
          code: nextSurveyCode(surveys),
          projectId,
          userId: session?.id ?? DEMO_USER.id,
          serviceType,
          status: 'draft',
          startedAt: now,
          updatedAt: now,
          serviceData: emptyServiceData(serviceType),
          sectors: [],
          photos: [],
        };
        const saved = await upsertSurvey(survey);
        replaceSurvey(saved);
        return saved;
      },
      saveSurvey: async (survey, silent) => {
        replaceSurvey(survey);
        const saved = await upsertSurvey(survey);
        replaceSurvey(saved);
        if (!silent) showToast('Guardado en este dispositivo');
        return saved;
      },
      completeSurvey: async (id) => {
        const current = surveysRef.current.find((item) => item.id === id);
        if (!current) return null;
        const now = new Date().toISOString();
        const saved = await upsertSurvey({
          ...current,
          status: 'completed',
          completedAt: now,
          updatedAt: now,
        });
        replaceSurvey(saved);
        return saved;
      },
      discardSurvey: async (id) => {
        await deleteSurvey(id);
        setSurveys((current) => current.filter((item) => item.id !== id));
        showToast('Borrador descartado');
      },
      addSector: async (surveyId) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return null;
        const sector = emptySector(surveyId);
        const saved = await upsertSurvey({ ...current, sectors: [...current.sectors, sector] });
        replaceSurvey(saved);
        return sector;
      },
      saveSector: async (surveyId, sector) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        const nextSector = { ...sector, updatedAt: new Date().toISOString() };
        const sectors = current.sectors.some((item) => item.id === sector.id)
          ? current.sectors.map((item) => (item.id === sector.id ? nextSector : item))
          : [...current.sectors, nextSector];
        const saved = await upsertSurvey({ ...current, sectors });
        replaceSurvey(saved);
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
        const saved = await upsertSurvey({ ...current, sectors: [...current.sectors, copy] });
        replaceSurvey(saved);
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
        const saved = await upsertSurvey({
          ...current,
          sectors: current.sectors.filter((item) => item.id !== sectorId),
        });
        replaceSurvey(saved);
      },
      addElement: async (surveyId, sectorId) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return null;
        const element = emptyElement(surveyId, sectorId, current.serviceType);
        const saved = await upsertSurvey({
          ...current,
          sectors: current.sectors.map((sector) =>
            sector.id === sectorId ? { ...sector, elements: [...sector.elements, element] } : sector,
          ),
        });
        replaceSurvey(saved);
        return element;
      },
      saveElement: async (surveyId, element) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        const nextElement = { ...element, updatedAt: new Date().toISOString() };
        const saved = await upsertSurvey({
          ...current,
          sectors: current.sectors.map((sector) =>
            sector.id === element.sectorId
              ? {
                  ...sector,
                  elements: sector.elements.some((item) => item.id === element.id)
                    ? sector.elements.map((item) => (item.id === element.id ? nextElement : item))
                    : [...sector.elements, nextElement],
                }
              : sector,
          ),
        });
        replaceSurvey(saved);
      },
      removeElement: async (surveyId, elementId) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        const element = current.sectors.flatMap((sector) => sector.elements).find((item) => item.id === elementId);
        if (element) {
          await Promise.all(element.photos.map((photo) => deleteLocalPhoto(photo.uri)));
        }
        const saved = await upsertSurvey({
          ...current,
          sectors: current.sectors.map((sector) => ({
            ...sector,
            elements: sector.elements.filter((item) => item.id !== elementId),
          })),
        });
        replaceSurvey(saved);
      },
      addPhoto: async ({ surveyId, sectorId, elementId, uri, category = 'overview' }) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return null;
        const localUri = await savePhotoLocally(uri);
        const photo: PhotoEvidence = {
          id: createId('pho'),
          uri: localUri,
          surveyId,
          sectorId,
          elementId,
          category,
          createdAt: new Date().toISOString(),
        };

        if (elementId && sectorId) {
          const sectors = current.sectors.map((sector) =>
            sector.id === sectorId
              ? {
                  ...sector,
                  elements: sector.elements.map((element) =>
                    element.id === elementId ? { ...element, photos: [...element.photos, photo] } : element,
                  ),
                }
              : sector,
          );
          replaceSurvey(await upsertSurvey({ ...current, sectors }));
        } else if (sectorId) {
          const sectors = current.sectors.map((sector) =>
            sector.id === sectorId ? { ...sector, photos: [...sector.photos, photo] } : sector,
          );
          replaceSurvey(await upsertSurvey({ ...current, sectors }));
        } else {
          replaceSurvey(await upsertSurvey({ ...current, photos: [...current.photos, photo] }));
        }
        return photo;
      },
      updatePhoto: async (surveyId, photoId, patch) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        const mapPhoto = (photo: PhotoEvidence) => (photo.id === photoId ? { ...photo, ...patch } : photo);
        const saved = await upsertSurvey({
          ...current,
          photos: current.photos.map(mapPhoto),
          sectors: current.sectors.map((sector) => ({
            ...sector,
            photos: sector.photos.map(mapPhoto),
            elements: sector.elements.map((element) => ({ ...element, photos: element.photos.map(mapPhoto) })),
          })),
        });
        replaceSurvey(saved);
      },
      removePhoto: async (surveyId, photoId) => {
        const current = surveysRef.current.find((item) => item.id === surveyId);
        if (!current) return;
        const all = collectPhotos(current);
        const photo = all.find((item) => item.id === photoId);
        if (photo) await deleteLocalPhoto(photo.uri);
        const saved = await upsertSurvey({
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
        });
        replaceSurvey(saved);
      },
      resetDemoData: async () => {
        await resetStoredDemo();
        const data = await loadAppData();
        setClients(data.clients);
        setProjects(data.projects);
        setSurveys(data.surveys);
        showToast('Datos demo restablecidos');
      },
      getClient: (id) => clients.find((item) => item.id === id),
      getProject: (id) => projects.find((item) => item.id === id),
      getSurvey: (id) => surveys.find((item) => item.id === id),
    }),
    [clients, projects, ready, session, surveys, toast],
  );

  return (
    <AppContext.Provider value={value}>
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
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
