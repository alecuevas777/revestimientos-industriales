import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { useApp } from '@/context/AppProvider';
import { replace, routeParam } from '@/lib/nav';

export default function NewSurveyScreen() {
  const { projectId: initialProjectId } = useLocalSearchParams<{ projectId?: string }>();
  const { projects, clients, startSurvey } = useApp();
  const startingProjectId = routeParam(initialProjectId) ?? '';
  const [projectId, setProjectId] = useState(startingProjectId);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!startingProjectId || started.current) return;
    started.current = true;
    void begin(startingProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startingProjectId]);

  async function begin(id: string) {
    setCreating(true);
    const survey = await startSurvey(id);
    replace(`/levantamientos/${survey.id}/editar`);
  }

  return (
    <Screen>
      <ScreenHeader title="Nuevo levantamiento" subtitle="Selecciona el proyecto de la visita" />
      {projects.length === 0 ? (
        <EmptyState
          title="No hay proyectos"
          description="Crea un cliente y un proyecto antes de registrar un levantamiento."
          action={<Button label="Crear proyecto" onPress={() => replace('/proyectos/nuevo')} />}
        />
      ) : (
        <View className="gap-2">
          {error ? <Text className="mb-1 text-sm text-danger">{error}</Text> : null}
          {projects.map((item) => (
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
          <View className="mt-6">
            <Button
              label="Comenzar levantamiento"
              loading={creating}
              onPress={() => {
                if (!projectId) {
                  setError('Selecciona un proyecto.');
                  return;
                }
                void begin(projectId);
              }}
            />
          </View>
        </View>
      )}
    </Screen>
  );
}
