let paused = 0;
let ignoreUntil = 0;

const IGNORE_AFTER_MS = 2500;

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
