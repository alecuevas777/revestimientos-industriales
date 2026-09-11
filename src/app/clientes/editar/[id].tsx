import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ClientForm } from '@/components/forms/ClientForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useApp } from '@/context/AppProvider';
import { routeParam } from '@/lib/nav';

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getClient, editClient } = useApp();
  const client = getClient(routeParam(id) ?? '');
  const [submitting, setSubmitting] = useState(false);

  if (!client) {
    return (
      <Screen>
        <ScreenHeader title="Editar cliente" />
        <EmptyState title="Cliente no encontrado" description="No es posible editar este registro." />
      </Screen>
    );
  }

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
    </Screen>
  );
}
