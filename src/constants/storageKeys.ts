export const STORAGE_KEYS = {
  session: '@ri/session',
  clients: '@ri/clients',
  projects: '@ri/projects',
  surveys: '@ri/surveys',
  schema: '@ri/schema',
  rememberEmail: '@ri/remember-email',
  workspace: (userId: string) => `@ri/workspace/${userId}`,
  draftReminder: (userId: string) => `@ri/draft-reminder/${userId}`,
} as const;

export const SCHEMA_VERSION = '6';
