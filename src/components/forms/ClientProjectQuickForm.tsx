import { useState } from 'react';
import { Text, View } from 'react-native';

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
      client: clientName.trim() ? undefined : 'Ingresa el nombre del cliente.',
      project: projectName.trim() ? undefined : 'Ingresa el nombre del proyecto.',
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
      <Text className="text-sm leading-5 text-muted">
        El cliente es la empresa. El proyecto es la planta o recinto. Un cliente puede tener varios proyectos.
      </Text>
      <View className="gap-4">
        <Text className="text-base font-semibold text-ink">Cliente</Text>
        <Input
          label="Nombre del cliente"
          hint="Empresa o razón social. Distinto al nombre del proyecto."
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
          hint="Persona de la empresa, no el nombre del cliente."
          value={contactName}
          onChangeText={setContactName}
          placeholder="María Soto"
        />
      </View>

      <View className="gap-4">
        <Text className="text-base font-semibold text-ink">Proyecto</Text>
        <Input
          label="Nombre del proyecto"
          hint="Planta, bodega o recinto. Distinto al nombre del cliente."
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
