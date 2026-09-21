import { useEffect, useState } from 'react';

import { useApp } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { getSurveyById, getTeamMember, loadCatalogForSurveys } from '@/remote';
import type { Client, Project, Survey } from '@/types';

export function useSurveyRecord(id?: string) {
  const { getSurvey, getProject, getClient } = useApp();
  const { session } = useAuth();
  const local = id ? getSurvey(id) : undefined;
  const [remote, setRemote] = useState<Survey | null>(null);
  const [teamProject, setTeamProject] = useState<Project | undefined>();
  const [teamClient, setTeamClient] = useState<Client | undefined>();
  const [ownerName, setOwnerName] = useState(session?.name ?? 'Técnico');
  const [loading, setLoading] = useState(Boolean(id) && !local);

  useEffect(() => {
    if (!id) {
      setRemote(null);
      setLoading(false);
      return;
    }
    if (local) {
      setRemote(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    void getSurveyById(id)
      .then((next) => {
        if (active) setRemote(next);
      })
      .catch(() => {
        if (active) setRemote(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, local]);

  const survey = local ?? remote ?? undefined;
  const ownedProject = survey ? getProject(survey.projectId) : undefined;
  const ownedClient = ownedProject ? getClient(ownedProject.clientId) : undefined;

  useEffect(() => {
    if (!survey) {
      setTeamProject(undefined);
      setTeamClient(undefined);
      return;
    }
    if (ownedProject && ownedClient) {
      setTeamProject(undefined);
      setTeamClient(undefined);
      return;
    }

    let active = true;
    void loadCatalogForSurveys([survey])
      .then((catalog) => {
        if (!active) return;
        setTeamProject(catalog.projects.find((project) => project.id === survey.projectId));
        const project = catalog.projects.find((item) => item.id === survey.projectId);
        setTeamClient(
          project ? catalog.clients.find((client) => client.id === project.clientId) : catalog.clients[0],
        );
      })
      .catch(() => {
        if (active) {
          setTeamProject(undefined);
          setTeamClient(undefined);
        }
      });

    return () => {
      active = false;
    };
  }, [ownedClient, ownedProject, survey]);

  useEffect(() => {
    if (!survey) return;
    if (survey.userId === session?.id) {
      setOwnerName(session.name);
      return;
    }
    let active = true;
    void getTeamMember(survey.userId)
      .then((member) => {
        if (active) setOwnerName(member?.name ?? 'Técnico');
      })
      .catch(() => {
        if (active) setOwnerName('Técnico');
      });
    return () => {
      active = false;
    };
  }, [session?.id, session?.name, survey]);

  return {
    survey,
    project: ownedProject ?? teamProject,
    client: ownedClient ?? teamClient,
    loading: loading && !survey,
    ownerName,
    isOwner: Boolean(survey && session && survey.userId === session.id),
  };
}
