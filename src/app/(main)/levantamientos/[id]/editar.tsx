import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { PhotoGrid } from '@/components/PhotoGrid';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressHeader } from '@/components/ui/ProgressHeader';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { WIZARD_STEPS } from '@/constants/labels';
import { photoCategoriesForService } from '@/constants/options';
import { useAppActions } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { InfoStep } from '@/features/survey/InfoStep';
import { NotesStep } from '@/features/survey/NotesStep';
import { ReviewStep } from '@/features/survey/ReviewStep';
import { SectorsStep } from '@/features/survey/SectorsStep';
import { ServiceConditionsStep } from '@/features/survey/ServiceConditionsStep';
import { useActionLock } from '@/hooks/useActionLock';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { useEditorTick } from '@/hooks/useEditorTick';
import { formatRelative } from '@/lib/format';
import { push, replace, routeParam } from '@/lib/nav';
import { clientProjectReportGaps } from '@/lib/reportReady';
import {
  collectPhotos,
  resumeStep,
  surveyNeedsSector,
  validateConditionFields,
  validateSurveyForComplete,
} from '@/lib/survey';
import type { Survey } from '@/types';

const LAST_STEP = WIZARD_STEPS.length - 1;

export default function EditSurveyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getSurvey,
    getProject,
    getClient,
    saveSurvey,
    addSector,
    duplicateSector,
    removeSector,
    addPhoto,
    updatePhoto,
    removePhoto,
    editClient,
    editProject,
    completeSurvey,
    discardSurvey,
  } = useAppActions();
  const tick = useEditorTick();
  const { session } = useAuth();
  const survey = getSurvey(routeParam(id) ?? '');
  const project = survey ? getProject(survey.projectId) : undefined;
  const client = project ? getClient(project.clientId) : undefined;
  const [step, setStep] = useState(() => (survey ? resumeStep(survey) : 0));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [savedAt, setSavedAt] = useState(survey?.updatedAt);
  const [errors, setErrors] = useState<string[]>([]);
  const run = useActionLock();
  const { ask, modal } = useConfirmAction();
  const finishingRef = useRef(false);

  useEffect(() => {
    if (!survey || survey.status !== 'completed' || finishingRef.current) return;
    replace(`/levantamientos/${survey.id}`);
  }, [survey?.id, survey?.status]);

  const savedLabel = useMemo(() => {
    if (!savedAt) return 'Guardado en este dispositivo';
    return `Guardado ${formatRelative(savedAt)}`;
  }, [savedAt]);

  function patch(partial: Partial<Survey>) {
    if (!survey) return;
    void saveSurvey({ id: survey.id, ...partial }, true);
    setSavedAt(new Date().toISOString());
    tick();
  }

  if (!survey) {
    return (
      <Screen>
        <ScreenHeader title="Levantamiento" />
        <EmptyState title="Borrador no encontrado" description="Este levantamiento ya no está disponible." />
      </Screen>
    );
  }

  const draft = survey;
  const reportGaps = clientProjectReportGaps(client, project);

  function latestDraft() {
    return getSurvey(draft.id) ?? draft;
  }

  function confirmRemoveSector(sectorId: string) {
    ask({
      title: '¿Eliminar sector?',
      message: 'Se perderán las observaciones, elementos y fotografías de este sector.',
      onConfirm: () => removeSector(draft.id, sectorId),
    });
  }

  function next() {
    const current = latestDraft();
    const nextErrors =
      step === 1
        ? validateConditionFields(current)
        : step === 2 && surveyNeedsSector(current) && current.sectors.filter((item) => item.name.trim()).length === 0
          ? [current.scope === 'critical_points' ? 'Registra al menos un punto crítico.' : 'Agrega al menos un sector.']
          : [];
    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }
    setErrors([]);
    setStep((current) => Math.min(current + 1, LAST_STEP));
  }

  function tryFinish() {
    const nextErrors = validateSurveyForComplete(latestDraft());
    setErrors(nextErrors);
    if (nextErrors.length === 0) setConfirmOpen(true);
  }

  async function finish() {
    const current = latestDraft();
    const nextErrors = validateSurveyForComplete(current);
    if (nextErrors.length) {
      setErrors(nextErrors);
      setConfirmOpen(false);
      return;
    }
    finishingRef.current = true;
    setSaving(true);
    try {
      const done = await completeSurvey(current.id);
      if (!done) {
        finishingRef.current = false;
        setErrors(['No se pudo finalizar el levantamiento. Inténtalo de nuevo.']);
        return;
      }
      setConfirmOpen(false);
      replace(`/levantamientos/${current.id}/exito`);
    } catch (error) {
      finishingRef.current = false;
      setErrors([error instanceof Error ? error.message : 'No se pudo finalizar el levantamiento.']);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      footer={
        <View className="gap-3 pt-2">
          {errors.length > 0 ? (
            <View className="rounded-2xl border border-danger-light bg-danger-light px-4 py-3">
              {errors.map((error) => (
                <Text key={error} className="text-sm leading-5 text-danger">
                  {error}
                </Text>
              ))}
            </View>
          ) : null}
          {step < LAST_STEP ? (
            <Button label="Continuar" onPress={next} />
          ) : (
            <Button label="Finalizar levantamiento" loading={saving} onPress={tryFinish} />
          )}
          {step > 0 ? (
            <Button label="Volver" variant="ghost" onPress={() => setStep((current) => current - 1)} />
          ) : (
            <Button label="Salir y continuar después" variant="ghost" onPress={() => replace('/(tabs)')} />
          )}
          <Button label="Descartar borrador" variant="ghost" onPress={() => setDiscardOpen(true)} />
        </View>
      }
      overlay={
        <>
          <ConfirmModal
            visible={confirmOpen}
            title="¿Finalizar levantamiento?"
            message={
              reportGaps.length
                ? `El informe PDF saldrá incompleto: ${reportGaps.join(', ')}. Puedes finalizar igual o volver a Información para completarlos.`
                : 'Podrás consultar toda la información posteriormente desde el historial.'
            }
            confirmLabel="Finalizar"
            loading={saving}
            onCancel={() => {
              if (!saving) setConfirmOpen(false);
            }}
            onConfirm={() => void run(finish)}
          />
          <ConfirmModal
            visible={discardOpen}
            title="¿Descartar borrador?"
            message="Se eliminará este levantamiento incompleto de este dispositivo."
            confirmLabel="Descartar"
            destructive
            onCancel={() => setDiscardOpen(false)}
            onConfirm={async () => {
              setDiscardOpen(false);
              await discardSurvey(draft.id);
              replace('/levantamientos');
            }}
          />
          {modal}
        </>
      }
    >
      <ScreenHeader title={draft.code} subtitle="Borrador · se guarda solo en este dispositivo" />
      <ProgressHeader step={step} savedLabel={savedLabel} />

      {step === 0 ? (
        <InfoStep
          survey={draft}
          project={project}
          client={client}
          technician={session?.name ?? 'Técnico'}
          savingReport={savingReport}
          onChange={(visitReason) => void patch({ visitReason })}
          onSaveReport={
            client && project
              ? async (clientDraft, projectDraft) => {
                  setSavingReport(true);
                  try {
                    await editClient(client.id, clientDraft);
                    await editProject(project.id, projectDraft);
                    tick();
                  } finally {
                    setSavingReport(false);
                  }
                }
              : undefined
          }
        />
      ) : null}

      {step === 1 ? (
        <ServiceConditionsStep
          survey={draft}
          errors={errors}
          onChange={(partial) => {
            setErrors([]);
            void patch(partial);
          }}
        />
      ) : null}

      {step === 2 ? (
        <SectorsStep
          survey={draft}
          error={errors[0]}
          onAdd={async () => {
            const sector = await addSector(draft.id);
            if (sector) push(`/levantamientos/${draft.id}/sector/${sector.id}`);
          }}
          onDuplicate={async (sectorId) => {
            const copy = await duplicateSector(draft.id, sectorId);
            if (copy) push(`/levantamientos/${draft.id}/sector/${copy.id}`);
          }}
          onRemove={confirmRemoveSector}
        />
      ) : null}

      {step === 3 ? (
        <View className="gap-3">
          <Text className="text-sm leading-5 text-muted">
            Agrega evidencia general o revisa las fotografías de sectores y elementos.
          </Text>
          <PhotoGrid
            photos={collectPhotos(draft)}
            sectors={draft.sectors}
            categories={photoCategoriesForService(draft.serviceType)}
            editable
            onAdd={async (uri) => {
              const photo = await addPhoto({ surveyId: draft.id, uri, category: 'overview' });
              tick();
              return photo;
            }}
            onUpdate={(photoId, photoPatch) => {
              void updatePhoto(draft.id, photoId, photoPatch);
              tick();
            }}
            onRemove={(photoId) => {
              void removePhoto(draft.id, photoId);
              tick();
            }}
          />
        </View>
      ) : null}

      {step === 4 ? <NotesStep survey={draft} onChange={(partial) => void patch(partial)} /> : null}

      {step === 5 ? (
        <ReviewStep
          survey={draft}
          project={project}
          client={client}
          technician={session?.name ?? 'Técnico'}
          errors={errors}
          onRemoveSector={confirmRemoveSector}
        />
      ) : null}
    </Screen>
  );
}
