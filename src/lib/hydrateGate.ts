import type { Client, Project, Survey } from '@/types';

type WorkspaceMemory = {
  userId: string;
  clients: Client[];
  projects: Project[];
  surveys: Survey[];
};

let paused = 0;
let ignoreUntil = 0;
let lastHydrateAt = 0;
let memory: WorkspaceMemory | null = null;

const IGNORE_AFTER_MS = 2500;
const FOREGROUND_COOLDOWN_MS = __DEV__ ? 60_000 : 12_000;

export function pauseHydrate() {
  paused += 1;
  ignoreUntil = Date.now() + IGNORE_AFTER_MS;
}

export function resumeHydrate() {
  paused = Math.max(0, paused - 1);
  ignoreUntil = Date.now() + IGNORE_AFTER_MS;
}

export function shouldSkipHydrate() {
  return paused > 0 || Date.now() < ignoreUntil;
}

export function shouldSkipForegroundHydrate() {
  if (shouldSkipHydrate()) return true;
  return Date.now() - lastHydrateAt < FOREGROUND_COOLDOWN_MS;
}

export function markHydrated() {
  lastHydrateAt = Date.now();
}

export function rememberWorkspace(next: WorkspaceMemory) {
  memory = next;
}

export function rememberedWorkspace(userId: string) {
  return memory?.userId === userId ? memory : null;
}

export function forgetWorkspace() {
  memory = null;
}
