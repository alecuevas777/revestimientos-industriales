import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { ClientProjectQuickForm } from '@/components/forms/ClientProjectQuickForm';
import { ServiceMark } from '@/components/ServiceMark';
import { Button } from '@/components/ui/Button';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { SERVICE_TYPE_HINTS, SERVICE_TYPE_LABELS } from '@/constants/labels';
import { useApp } from '@/context/AppProvider';
import { useActionLock } from '@/hooks/useActionLock';
import { replace, routeParam } from '@/lib/nav';
import type { ServiceType } from '@/types';

const SERVICES: ServiceType[] = ['epoxy', 'pu_cement', 'roof_waterproofing', 'corrosion_control'];

export default function NewSurveyScreen() {
  const { projectId: initialProjectId, origen } = useLocalSearchParams<{
    projectId?: string;
    origen?: string;
  }>();
  const { projects, clients, startSurvey, ensureClientAndProject } = useApp();
  const visibleProjects = useMemo(
    () =>
      projects.filter((project) => {
        const client = clients.find((item) => item.id === project.clientId);
        return Boolean(client && !client.archived);
      }),
    [clients, projects],
  );
  const [origin, setOrigin] = useState<'existing' | 'new'>(() => {
    if (routeParam(origen) === 'nuevo' || visibleProjects.length === 0) return 'new';
    return 'existing';
  });
  const [projectId, setProjectId] = useState(routeParam(initialProjectId) ?? '');
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [savingOrigin, setSavingOrigin] = useState(false);
  const run = useActionLock();

  async function begin() {
    if (!projectId) {
      setError('Selecciona o crea un proyecto.');
      return;
    }
    if (!serviceType) {
      setError('Selecciona el tipo de servicio.');
      return;
    }
    await run(async () => {
      setCreating(true);
      try {
        const survey = await startSurvey(projectId, serviceType);
        replace(`/levantamientos/${survey.id}/editar`);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'No se pudo crear el levantamiento.');
      } finally {
        setCreating(false);
      }
    });
  }

  return (
    <Screen>
      <ScreenHeader title="Nuevo levantamiento" subtitle="Cliente, proyecto y tipo de servicio" />
      <View className="gap-6 pb-6">
        {error ? <Text className="text-sm text-danger">{error}</Text> : null}

        {visibleProjects.length > 0 ? (
          <FilterChips
            value={origin}
            onChange={(value) => {
              setOrigin(value);
              if (value === 'new') setProjectId('');
              setError('');
            }}
            options={[
              { value: 'existing', label: 'Proyecto existente' },
              { value: 'new', label: 'Nuevo cliente y proyecto' },
            ]}
          />
        ) : (
          <Text className="text-sm leading-5 text-muted">
            Crea el cliente (empresa) y un proyecto (planta o recinto) con nombres distintos. Después eliges el servicio.
          </Text>
        )}

        {origin === 'existing' && visibleProjects.length > 0 ? (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink">Proyecto</Text>
            {visibleProjects.map((item) => (
              <SelectableCard
                key={item.id}
                title={item.name}
                description={clients.find((client) => client.id === item.clientId)?.name}
                selected={projectId === item.id}
                onPress={() => {
                  setProjectId(item.id);
                  setError('');
                }}
              />
            ))}
          </View>
        ) : (
          <View className="gap-3">
            <Text className="text-sm font-semibold text-ink">Cliente y proyecto</Text>
            <Text className="text-sm leading-5 text-muted">
              Primero la empresa, después el recinto. Un cliente puede tener varios proyectos, y un proyecto varios levantamientos.
            </Text>
            {projectId ? (
              <View className="rounded-2xl border border-line bg-white px-4 py-3">
                <Text className="text-base font-semibold text-ink">
                  {projects.find((item) => item.id === projectId)?.name}
                </Text>
                <Text className="mt-1 text-sm text-muted">
                  {clients.find(
                    (client) =>
                      client.id === projects.find((item) => item.id === projectId)?.clientId,
                  )?.name}
                </Text>
              </View>
            ) : (
              <ClientProjectQuickForm
                submitting={savingOrigin}
                onSubmit={(setup) =>
                  void run(async () => {
                    setSavingOrigin(true);
                    try {
                      const created = await ensureClientAndProject(setup);
                      setProjectId(created.project.id);
                      setError('');
                    } finally {
                      setSavingOrigin(false);
                    }
                  })
                }
              />
            )}
          </View>
        )}

        {projectId ? (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink">¿Qué servicio se está levantando?</Text>
            {SERVICES.map((item) => (
              <SelectableCard
                key={item}
                title={SERVICE_TYPE_LABELS[item]}
                description={SERVICE_TYPE_HINTS[item]}
                selected={serviceType === item}
                onPress={() => {
                  setServiceType(item);
                  setError('');
                }}
              />
            ))}
          </View>
        ) : null}

        {serviceType ? (
          <View className="rounded-2xl border border-line bg-white px-4 py-3">
            <ServiceMark type={serviceType} size="md" />
          </View>
        ) : null}

        {projectId ? (
          <Button
            label="Comenzar levantamiento"
            loading={creating}
            onPress={() => void begin()}
          />
        ) : null}
      </View>
    </Screen>
  );
}
