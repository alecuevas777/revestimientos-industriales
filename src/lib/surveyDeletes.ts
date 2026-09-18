import {
  EMPTY_REMOVED_CHILDREN,
  hasRemovedChildren,
  mergeRemovedChildren,
  type RemovedSurveyChildren,
} from '@/lib/survey';

const pending = new Map<string, RemovedSurveyChildren>();

export function noteRemovedChildren(surveyId: string, removed: RemovedSurveyChildren) {
  if (!hasRemovedChildren(removed)) return;
  pending.set(surveyId, mergeRemovedChildren(pending.get(surveyId) ?? EMPTY_REMOVED_CHILDREN, removed));
}

export function peekRemovedChildren(surveyId: string) {
  return pending.get(surveyId) ?? EMPTY_REMOVED_CHILDREN;
}

export function clearRemovedChildren(surveyId: string) {
  pending.delete(surveyId);
}
