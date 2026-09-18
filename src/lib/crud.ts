export function clientDeleteMessage(projectCount: number, surveyCount: number) {
  const parts = [
    projectCount > 0 ? `${projectCount} ${projectCount === 1 ? 'proyecto' : 'proyectos'}` : null,
    surveyCount > 0 ? `${surveyCount} ${surveyCount === 1 ? 'levantamiento' : 'levantamientos'}` : null,
  ].filter(Boolean);
  if (parts.length === 0) return 'Se eliminará este cliente. Esta acción no se puede deshacer.';
  return `Se eliminarán también ${parts.join(' y ')}. Esta acción no se puede deshacer.`;
}

export function projectDeleteMessage(surveyCount: number) {
  if (!surveyCount) return 'Se eliminará este proyecto. Esta acción no se puede deshacer.';
  return `Se eliminarán también ${surveyCount} ${surveyCount === 1 ? 'levantamiento' : 'levantamientos'}. Esta acción no se puede deshacer.`;
}
