import { STORAGE_KEYS } from '@/constants/storageKeys';
import { readJson, writeJson } from '@/storage/json';

export type DraftReminderState = {
  day: string;
  ids: string[];
};

export function reminderDayKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shouldShowDraftReminder(state: DraftReminderState | null, draftIds: string[]) {
  if (draftIds.length === 0) return false;
  if (!state || state.day !== reminderDayKey()) return true;
  return draftIds.some((id) => !state.ids.includes(id));
}

export async function readDraftReminder(userId: string) {
  return readJson<DraftReminderState | null>(STORAGE_KEYS.draftReminder(userId), null);
}

export async function saveDraftReminder(userId: string, draftIds: string[]) {
  await writeJson<DraftReminderState>(STORAGE_KEYS.draftReminder(userId), {
    day: reminderDayKey(),
    ids: draftIds,
  });
}
