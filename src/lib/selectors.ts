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
