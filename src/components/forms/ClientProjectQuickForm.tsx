import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ClientProjectSetup } from '@/types';

type Props = {
  submitting?: boolean;
  onSubmit: (setup: ClientProjectSetup) => void;
};

export function ClientProjectQuickForm({ submitting, onSubmit }: Props) {
  const [clientName, setClientName] = useState('');
  const [contactName, setContactName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [city, setCity] = useState('');
  const [errors, setErrors] = useState<{ client?: string; project?: string }>({});

  function handleSubmit() {
    const nextErrors = {
      client: clientName.trim() ? undefined : 'Ingresa el cliente.',
      project: projectName.trim() ? undefined : 'Ingresa el proyecto o recinto.',
    };
    setErrors(nextErrors);
    if (nextErrors.client || nextErrors.project) return;

    const cityValue = city.trim() || undefined;
    onSubmit({
      client: {
        name: clientName.trim(),
        contactName: contactName.trim() || undefined,
        city: cityValue,
      },
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
