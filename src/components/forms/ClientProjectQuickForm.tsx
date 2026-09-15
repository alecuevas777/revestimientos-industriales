import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectableCard } from '@/components/ui/SelectableCard';
import type { Client, ClientProjectSetup } from '@/types';

type Props = {
  clients: Client[];
  submitting?: boolean;
  onSubmit: (setup: ClientProjectSetup) => void;
};

export function ClientProjectQuickForm({ clients, submitting, onSubmit }: Props) {
  const activeClients = clients.filter((client) => !client.archived);
  const [clientId, setClientId] = useState<'new' | string>('new');
  const [clientName, setClientName] = useState('');
  const [contactName, setContactName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [city, setCity] = useState('');
  const [errors, setErrors] = useState<{ client?: string; project?: string }>({});

  function handleSubmit() {
    const creatingClient = clientId === 'new';
    const nextErrors = {
      client: creatingClient && !clientName.trim() ? 'Ingresa el cliente.' : undefined,
      project: projectName.trim() ? undefined : 'Ingresa el proyecto o recinto.',
    };
    setErrors(nextErrors);
    if (nextErrors.client || nextErrors.project) return;

    const cityValue = city.trim() || undefined;
    onSubmit({
      clientId: creatingClient ? undefined : clientId,
      client: creatingClient
        ? {
            name: clientName.trim(),
            contactName: contactName.trim() || undefined,
            city: cityValue,
          }
        : undefined,
      project: {
        name: projectName.trim(),
        city: cityValue,
        location: cityValue,
        address: cityValue,
        status: 'active',
      },
    });
  }

  return (
    <View className="gap-5">
      <View className="gap-2">
        <Text className="text-sm font-semibold text-ink">Cliente</Text>
        <SelectableCard
          title="Nuevo cliente"
          description="Razón social mínima. El resto se puede completar después."
          selected={clientId === 'new'}
          onPress={() => {
            setClientId('new');
            setErrors((current) => ({ ...current, client: undefined }));
          }}
        />
        {activeClients.map((client) => (
          <SelectableCard
            key={client.id}
            title={client.name}
            description={client.city}
            selected={clientId === client.id}
            onPress={() => {
              setClientId(client.id);
              setErrors((current) => ({ ...current, client: undefined }));
            }}
          />
        ))}
      </View>

      {clientId === 'new' ? (
        <View className="gap-4">
          <Input
            label="Razón social"
            value={clientName}
            onChangeText={(value) => {
              setClientName(value);
              setErrors((current) => ({ ...current, client: undefined }));
            }}
            error={errors.client}
            placeholder="Industrias del Pacífico"
          />
          <Input
            label="Contacto (opcional)"
            value={contactName}
            onChangeText={setContactName}
            placeholder="María Soto"
          />
        </View>
      ) : null}

      <View className="gap-4">
        <Input
          label="Proyecto o recinto"
          value={projectName}
          onChangeText={(value) => {
            setProjectName(value);
            setErrors((current) => ({ ...current, project: undefined }));
          }}
          error={errors.project}
          placeholder="Planta Coronel"
        />
        <Input
          label="Ciudad / ubicación (opcional)"
          value={city}
          onChangeText={setCity}
          placeholder="Coronel"
        />
      </View>

      <Button label="Crear y continuar" onPress={handleSubmit} loading={submitting} />
    </View>
  );
}
