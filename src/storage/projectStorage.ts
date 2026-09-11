import { STORAGE_KEYS } from '@/constants/storageKeys';
import { createId } from '@/lib/id';
import type { Project, ProjectDraft } from '@/types';

import { readJson, writeJson } from './json';

export async function getProjects() {
  return readJson<Project[]>(STORAGE_KEYS.projects, []);
}

export async function saveProjects(projects: Project[]) {
  await writeJson(STORAGE_KEYS.projects, projects);
}

export async function createProject(draft: ProjectDraft) {
  const projects = await getProjects();
  const now = new Date().toISOString();
  const project: Project = {
    ...draft,
    id: createId('prj'),
    createdAt: now,
    updatedAt: now,
  };
  await saveProjects([project, ...projects]);
  return project;
}

export async function updateProject(id: string, draft: Partial<Project>) {
  const projects = await getProjects();
  const next = projects.map((project) =>
    project.id === id ? { ...project, ...draft, updatedAt: new Date().toISOString() } : project,
  );
  await saveProjects(next);
  return next.find((project) => project.id === id) ?? null;
}
