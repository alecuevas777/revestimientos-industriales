import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ClientForm } from '@/components/forms/ClientForm';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useApp } from '@/context/AppProvider';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { clientDeleteMessage } from '@/lib/crud';
import { projectsForClient, surveysForClient } from '@/lib/selectors';
import { replace, routeParam } from '@/lib/nav';

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getClient, projects, surveys, editClient, removeClient } = useApp();
  const client = getClient(routeParam(id) ?? '');
  const [submitting, setSubmitting] = useState(false);
  const { ask, modal } = useConfirmAction();

  if (!client) {
    return (
      <Screen>
        <ScreenHeader title="Editar cliente" />
        <EmptyState title="Cliente no encontrado" description="No es posible editar este registro." />
      </Screen>
    );
  }

  const projectCount = projectsForClient(client.id, projects).length;
  const surveyCount = surveysForClient(client.id, projects, surveys).length;

  return (
    <Screen>
      <ScreenHeader title="Editar cliente" />
      <ClientForm
        initial={client}
        submitting={submitting}
        onSubmit={async (draft) => {
          setSubmitting(true);
          await editClient(client.id, draft);
          setSubmitting(false);
          router.back();
        }}
      />
      <View className="pb-8">
        <Button
          label="Eliminar cliente"
          variant="danger"
          onPress={() =>
            ask({
              title: '¿Eliminar cliente?',
              message: clientDeleteMessage(projectCount, surveyCount),
              onConfirm: async () => {
                await removeClient(client.id);
                replace('/clientes');
              },
            })
          }
        />
      </View>
      {modal}
    </Screen>
  );
}
