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

  async function begin() {
    if (!projectId) {
      setError('Selecciona o crea un proyecto.');
      return;
    }
    if (!serviceType) {
      setError('Selecciona el tipo de servicio.');
      return;
    }
    setCreating(true);
    const survey = await startSurvey(projectId, serviceType);
    replace(`/levantamientos/${survey.id}/editar`);
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
            Crea el cliente y su proyecto en un solo paso. Después eliges el servicio.
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
              Solo lo esencial. Quedan asociados y listos para este levantamiento.
            </Text>
            <ClientProjectQuickForm
              clients={clients}
              submitting={savingOrigin}
              onSubmit={async (setup) => {
                setSavingOrigin(true);
                try {
                  const created = await ensureClientAndProject(setup);
                  setProjectId(created.project.id);
                  setOrigin('existing');
                  setError('');
                } finally {
                  setSavingOrigin(false);
                }
              }}
            />
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
