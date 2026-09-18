import { useState } from 'react';

import { ClientForm } from '@/components/forms/ClientForm';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAppActions } from '@/context/AppProvider';
import { replace } from '@/lib/nav';

export default function NewClientScreen() {
  const { addClient, addProject } = useAppActions();
  const [submitting, setSubmitting] = useState(false);

  return (
    <Screen>
      <ScreenHeader
        title="Nuevo cliente"
        subtitle="La empresa. El proyecto y los levantamientos se asocian después."
      />
      <ClientForm
        includeFirstProject
        submitting={submitting}
        onSubmit={async (draft, firstProjectName) => {
          setSubmitting(true);
          try {
            const client = await addClient(draft);
            if (firstProjectName) {
              await addProject({
                name: firstProjectName,
                clientId: client.id,
                status: 'active',
                city: draft.city,
                address: draft.address,
                location: draft.city || draft.address,
              });
            }
            replace(`/clientes/${client.id}`);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </Screen>
  );
}
