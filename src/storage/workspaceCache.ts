import { STORAGE_KEYS } from '@/constants/storageKeys';
import type { Client, Project, Survey } from '@/types';

import { getClients } from './clientStorage';
import { readJson, writeJson } from './json';
import { getProjects } from './projectStorage';
import { getSurveys } from './surveyStorage';

export type WorkspaceSnapshot = {
  clients: Client[];
  projects: Project[];
  surveys: Survey[];
};

export const EMPTY_WORKSPACE: WorkspaceSnapshot = {
  clients: [],
  projects: [],
  surveys: [],
};

export async function readWorkspaceCache(userId: string) {
  return readJson<WorkspaceSnapshot>(STORAGE_KEYS.workspace(userId), EMPTY_WORKSPACE);
}

export async function writeWorkspaceCache(userId: string, snapshot: WorkspaceSnapshot) {
  await writeJson(STORAGE_KEYS.workspace(userId), snapshot);
}

export async function readLegacyWorkspace(): Promise<WorkspaceSnapshot> {
  const [clients, projects, surveys] = await Promise.all([getClients(), getProjects(), getSurveys()]);
  return { clients, projects, surveys };
}
