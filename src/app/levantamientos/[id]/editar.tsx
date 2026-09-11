import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { PhotoGrid } from '@/components/PhotoGrid';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressHeader } from '@/components/ui/ProgressHeader';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { WIZARD_STEPS } from '@/constants/labels';
import { useApp } from '@/context/AppProvider';
import { ConditionsStep } from '@/features/survey/ConditionsStep';
import { InfoStep } from '@/features/survey/InfoStep';
import { NotesStep } from '@/features/survey/NotesStep';
import { ReviewStep } from '@/features/survey/ReviewStep';
import { SectorsStep } from '@/features/survey/SectorsStep';
import { SurfaceStep } from '@/features/survey/SurfaceStep';
import { formatRelative } from '@/lib/format';
import { push, replace, routeParam } from '@/lib/nav';
import {
  collectPhotos,
  resumeStep,
  surveyNeedsSector,
  validateConditionFields,
  validateSurfaceFields,
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
    session,
    saveSurvey,
    addSector,
    duplicateSector,
    addPhoto,
    updatePhoto,
    removePhoto,
    completeSurvey,
    discardSurvey,
  } = useApp();
  const survey = getSurvey(routeParam(id) ?? '');
  const project = survey ? getProject(survey.projectId) : undefined;
  const client = project ? getClient(project.clientId) : undefined;
  const [step, setStep] = useState(() => (survey ? resumeStep(survey) : 0));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(survey?.updatedAt);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (survey?.status === 'completed') {
      replace(`/levantamientos/${survey.id}`);
    }
  }, [survey]);

  const savedLabel = useMemo(() => {
    if (!savedAt) return 'Guardado en este dispositivo';
    return `Guardado ${formatRelative(savedAt)}`;
  }, [savedAt]);

  async function patch(partial: Partial<Survey>) {
    if (!survey) return;
    await saveSurvey({ ...survey, ...partial }, true);
    setSavedAt(new Date().toISOString());
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

  function next() {
    const nextErrors =
      step === 1
        ? validateSurfaceFields(draft)
        : step === 2
          ? validateConditionFields(draft)
          : step === 3 && surveyNeedsSector(draft) && draft.sectors.filter((item) => item.name.trim()).length === 0
            ? [draft.scope === 'critical_points' ? 'Registra al menos un punto crítico.' : 'Agrega al menos un sector.']
            : [];
    if (nextErrors.length) {
      setErrors(nextErrors);
      return;
    }
    setErrors([]);
    setStep((current) => Math.min(current + 1, LAST_STEP));
  }

  return (
    <Screen>
      <ScreenHeader title={draft.code} subtitle="Borrador · se guarda solo en este dispositivo" />
      <ProgressHeader step={step} savedLabel={savedLabel} />

      {step === 0 ? (
        <InfoStep
          survey={draft}
          project={project}
          client={client}
          technician={session?.name ?? 'Técnico Demo'}
          onChange={(visitReason) => void patch({ visitReason })}
        />
      ) : null}

      {step === 1 ? (
        <SurfaceStep
          survey={draft}
          errors={{
            surfaceType: errors.find((item) => item.includes('tipo de superficie')),
            totalArea: errors.find((item) => item.includes('superficie aproximada')),
            scope: errors.find((item) => item.includes('alcance')),
          }}
          onChange={(partial) => {
            setErrors([]);
            void patch(partial);
          }}
        />
      ) : null}

      {step === 2 ? (
        <ConditionsStep
          survey={draft}
          error={errors.find((item) => item.includes('estado general'))}
          onChange={(partial) => {
            setErrors([]);
            void patch(partial);
          }}
        />
      ) : null}

      {step === 3 ? (
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
        />
      ) : null}

      {step === 4 ? (
        <View className="gap-3">
          <Text className="text-sm leading-5 text-muted">
            Agrega evidencia general o revisa las fotografías asociadas a cada sector.
          </Text>
          <PhotoGrid
            photos={collectPhotos(draft)}
            sectors={draft.sectors}
            editable
            onAdd={(uri) => void addPhoto({ surveyId: draft.id, uri, category: 'overview' })}
            onUpdate={(photoId, photoPatch) => void updatePhoto(draft.id, photoId, photoPatch)}
            onRemove={(photoId) => void removePhoto(draft.id, photoId)}
          />
        </View>
      ) : null}

      {step === 5 ? (
        <NotesStep
          survey={draft}
          onChange={(partial) => void patch(partial)}
        />
      ) : null}

      {step === 6 ? (
        <ReviewStep
          survey={draft}
          project={project}
          client={client}
          technician={session?.name ?? 'Técnico Demo'}
          errors={errors}
        />
      ) : null}

      <View className="mt-8 gap-3 pb-6">
        {step < LAST_STEP ? (
          <Button label="Continuar" onPress={next} />
        ) : (
          <Button
            label="Finalizar levantamiento"
            loading={saving}
            onPress={() => {
              const nextErrors = validateSurveyForComplete(draft);
              setErrors(nextErrors);
              if (nextErrors.length === 0) setConfirmOpen(true);
            }}
          />
        )}
        {step > 0 ? (
          <Button label="Volver" variant="ghost" onPress={() => setStep((current) => current - 1)} />
        ) : (
          <Button label="Salir y continuar después" variant="ghost" onPress={() => replace('/(tabs)')} />
        )}
        <Button label="Descartar borrador" variant="ghost" onPress={() => setDiscardOpen(true)} />
      </View>

      <ConfirmModal
        visible={confirmOpen}
        title="¿Finalizar levantamiento?"
        message="Podrás consultar toda la información posteriormente desde el historial."
        confirmLabel="Finalizar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          setSaving(true);
          await completeSurvey(draft.id);
          setSaving(false);
          replace(`/levantamientos/${draft.id}/exito`);
        }}
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
          replace('/(tabs)');
        }}
      />
    </Screen>
  );
}
