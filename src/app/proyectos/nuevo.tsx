import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ProjectForm } from '@/components/forms/ProjectForm';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useApp } from '@/context/AppProvider';
import { push, replace, routeParam } from '@/lib/nav';

export default function NewProjectScreen() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const lockedClientId = routeParam(clientId);
  const { clients, addProject } = useApp();
  const [submitting, setSubmitting] = useState(false);

  return (
    <Screen>
      <ScreenHeader title="Nuevo proyecto" subtitle="Debe quedar asociado a un cliente" />
      {clients.length === 0 ? (
        <EmptyState
          title="Primero crea un cliente"
          description="Un proyecto no puede existir sin cliente."
          action={<Button label="Crear cliente" onPress={() => push('/clientes/nuevo')} />}
        />
      ) : (
        <ProjectForm
          clients={clients}
          lockedClientId={lockedClientId}
          submitting={submitting}
          onSubmit={async (draft) => {
            setSubmitting(true);
            const project = await addProject(draft);
            setSubmitting(false);
            replace(`/proyectos/${project.id}`);
          }}
        />
      )}
    </Screen>
  );
}
