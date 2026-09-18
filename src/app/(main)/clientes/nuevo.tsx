import { useState } from 'react';

import { ClientForm } from '@/components/forms/ClientForm';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAppActions } from '@/context/AppProvider';
import { replace } from '@/lib/nav';

export default function NewClientScreen() {
  const { addClient } = useAppActions();
  const [submitting, setSubmitting] = useState(false);

  return (
    <Screen>
      <ScreenHeader title="Nuevo cliente" subtitle="Ficha comercial del recinto" />
      <ClientForm
        submitting={submitting}
        onSubmit={async (draft) => {
          setSubmitting(true);
          const client = await addClient(draft);
          setSubmitting(false);
          replace(`/clientes/${client.id}`);
        }}
      />
    </Screen>
  );
}
