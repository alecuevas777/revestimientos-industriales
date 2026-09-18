import { lastActivityAt } from '@/lib/survey';
import type { Client, Project, Survey } from '@/types';

export function projectsForClient(clientId: string, projects: Project[]) {
  return projects.filter((project) => project.clientId === clientId);
}

export function surveysForClient(clientId: string, projects: Project[], surveys: Survey[]) {
  const ids = new Set(projectsForClient(clientId, projects).map((project) => project.id));
  return surveys.filter((survey) => ids.has(survey.projectId));
}

export function surveysForProject(projectId: string, surveys: Survey[]) {
  return surveys.filter((survey) => survey.projectId === projectId);
}

export function surveysForUser(userId: string, surveys: Survey[]) {
  return [...surveys]
    .filter((survey) => survey.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function lastClientActivity(client: Client, projects: Project[], surveys: Survey[]) {
  return lastActivityAt([
    client.updatedAt,
    ...projectsForClient(client.id, projects).map((project) => project.updatedAt),
    ...surveysForClient(client.id, projects, surveys).map((survey) => survey.updatedAt),
  ]);
}

export function lastProjectSurveyAt(projectId: string, surveys: Survey[]) {
  return lastActivityAt(
    surveysForProject(projectId, surveys).map((survey) => survey.completedAt ?? survey.updatedAt),
  );
}

export function draftsOf(surveys: Survey[]) {
  return [...surveys]
    .filter((survey) => survey.status === 'draft')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function completedOf(surveys: Survey[]) {
  return [...surveys]
    .filter((survey) => survey.status === 'completed')
    .sort((a, b) => (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt));
}

export function recentProjects(projects: Project[], surveys: Survey[], limit = 3) {
  return [...projects]
    .sort((a, b) => {
      const aAt = lastProjectSurveyAt(a.id, surveys) ?? a.updatedAt;
      const bAt = lastProjectSurveyAt(b.id, surveys) ?? b.updatedAt;
      return bAt.localeCompare(aAt);
    })
    .slice(0, limit);
}

export function indexById<T extends { id: string }>(items: T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

export function projectCountByClientId(projects: Project[]) {
  const counts = new Map<string, number>();
  for (const project of projects) {
    counts.set(project.clientId, (counts.get(project.clientId) ?? 0) + 1);
  }
  return counts;
}

export function surveyCountByProjectId(surveys: Survey[]) {
  const counts = new Map<string, number>();
  for (const survey of surveys) {
    counts.set(survey.projectId, (counts.get(survey.projectId) ?? 0) + 1);
  }
  return counts;
}

export function surveyCountByClientId(projects: Project[], surveys: Survey[]) {
  const byProject = surveyCountByProjectId(surveys);
  const counts = new Map<string, number>();
  for (const project of projects) {
    counts.set(project.clientId, (counts.get(project.clientId) ?? 0) + (byProject.get(project.id) ?? 0));
  }
  return counts;
}

export function lastActivityByClientId(clients: Client[], projects: Project[], surveys: Survey[]) {
  const last = new Map<string, string>();
  for (const client of clients) last.set(client.id, client.updatedAt);
  for (const project of projects) {
    const prev = last.get(project.clientId);
    if (!prev || project.updatedAt > prev) last.set(project.clientId, project.updatedAt);
  }
  const projectClient = new Map(projects.map((project) => [project.id, project.clientId]));
  for (const survey of surveys) {
    const clientId = projectClient.get(survey.projectId);
    if (!clientId) continue;
    const prev = last.get(clientId);
    if (!prev || survey.updatedAt > prev) last.set(clientId, survey.updatedAt);
  }
  return last;
}

export function lastSurveyAtByProjectId(surveys: Survey[]) {
  const last = new Map<string, string>();
  for (const survey of surveys) {
    const at = survey.completedAt ?? survey.updatedAt;
    const prev = last.get(survey.projectId);
    if (!prev || at > prev) last.set(survey.projectId, at);
  }
  return last;
}
