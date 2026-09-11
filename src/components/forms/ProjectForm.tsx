import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { TextArea } from '@/components/ui/TextArea';
import { PROJECT_STATUS_LABELS } from '@/constants/labels';
import type { Client, Project, ProjectDraft, ProjectStatus } from '@/types';

const STATUSES: ProjectStatus[] = ['active', 'pending', 'finished'];

type Props = {
  clients: Client[];
  initial?: Project;
  lockedClientId?: string;
  submitting?: boolean;
  onSubmit: (draft: ProjectDraft) => void;
};

export function ProjectForm({ clients, initial, lockedClientId, submitting, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [clientId, setClientId] = useState(initial?.clientId ?? lockedClientId ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [siteContactName, setSiteContactName] = useState(initial?.siteContactName ?? '');
  const [siteContactPhone, setSiteContactPhone] = useState(initial?.siteContactPhone ?? '');
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'active');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [observations, setObservations] = useState(initial?.observations ?? '');
  const [errors, setErrors] = useState<{ name?: string; clientId?: string }>({});

  function handleSubmit() {
    const nextErrors = {
      name: name.trim() ? undefined : 'Ingresa el nombre del proyecto.',
      clientId: clientId ? undefined : 'Selecciona un cliente.',
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.clientId) return;

    const cityValue = city.trim();
    onSubmit({
      name: name.trim(),
      clientId,
      code: code.trim() || undefined,
      address: address.trim() || undefined,
      city: cityValue || undefined,
      location: location.trim() || (cityValue ? cityValue : undefined),
      siteContactName: siteContactName.trim() || undefined,
      siteContactPhone: siteContactPhone.trim() || undefined,
      status,
      description: description.trim() || undefined,
      observations: observations.trim() || undefined,
    });
  }

  return (
    <View className="gap-4 pb-8">
      <Input
        label="Nombre del proyecto"
        value={name}
        onChangeText={(value) => {
          setName(value);
          setErrors((current) => ({ ...current, name: undefined }));
        }}
        error={errors.name}
        placeholder="Planta Coronel"
      />

      <View className="gap-2">
        <Text className="text-sm font-semibold text-ink">Cliente</Text>
        {errors.clientId ? <Text className="text-sm text-danger">{errors.clientId}</Text> : null}
        <View className="gap-2">
          {clients.filter((client) => !client.archived || client.id === clientId).map((client) => (
            <SelectableCard
              key={client.id}
              title={client.name}
              description={client.city || client.address}
              selected={clientId === client.id}
              onPress={() => {
                if (lockedClientId) return;
                setClientId(client.id);
                setErrors((current) => ({ ...current, clientId: undefined }));
              }}
            />
          ))}
        </View>
      </View>

      <Input label="Código interno (opcional)" value={code} onChangeText={setCode} placeholder="VIC-COR-01" />
      <Input label="Dirección / ubicación" value={address} onChangeText={setAddress} placeholder="Camino a Coronel 2450" />
      <Input label="Comuna / ciudad" value={city} onChangeText={setCity} placeholder="Coronel" />
      <Input
        label="Persona de contacto en terreno"
        value={siteContactName}
        onChangeText={setSiteContactName}
        placeholder="Luis Rivas"
      />
      <Input
        label="Teléfono contacto"
        value={siteContactPhone}
        onChangeText={setSiteContactPhone}
        keyboardType="phone-pad"
        placeholder="+56 9 0000 0000"
      />

      <View className="gap-2">
        <Text className="text-sm font-semibold text-ink">Estado</Text>
        <View className="gap-2">
          {STATUSES.map((item) => (
            <SelectableCard
              key={item}
              title={PROJECT_STATUS_LABELS[item]}
              selected={status === item}
              onPress={() => setStatus(item)}
            />
          ))}
        </View>
      </View>

      <TextArea label="Descripción" value={description} onChangeText={setDescription} placeholder="Alcance general del recinto" />
      <TextArea label="Observaciones" value={observations} onChangeText={setObservations} placeholder="Accesos, restricciones o notas de terreno" />
      <Button label="Guardar proyecto" onPress={handleSubmit} loading={submitting} />
    </View>
  );
}
