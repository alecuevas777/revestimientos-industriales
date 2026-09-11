import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import type { Client, ClientDraft } from '@/types';

type Props = {
  initial?: Client;
  submitting?: boolean;
  onSubmit: (draft: ClientDraft) => void;
};

export function ClientForm({ initial, submitting, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [rut, setRut] = useState(initial?.rut ?? '');
  const [contactName, setContactName] = useState(initial?.contactName ?? '');
  const [contactRole, setContactRole] = useState(initial?.contactRole ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [observations, setObservations] = useState(initial?.observations ?? '');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!name.trim()) {
      setError('Ingresa el nombre o razón social.');
      return;
    }

    onSubmit({
      name: name.trim(),
      rut: rut.trim() || undefined,
      contactName: contactName.trim() || undefined,
      contactRole: contactRole.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      observations: observations.trim() || undefined,
    });
  }

  return (
    <View className="gap-4 pb-8">
      <Input
        label="Razón social / nombre"
        value={name}
        onChangeText={(value) => {
          setName(value);
          setError('');
        }}
        error={error}
        placeholder="Vicast Industrial"
      />
      <Input label="RUT (opcional)" value={rut} onChangeText={setRut} placeholder="76.452.110-K" />
      <Input label="Persona de contacto" value={contactName} onChangeText={setContactName} placeholder="María Soto" />
      <Input label="Cargo del contacto (opcional)" value={contactRole} onChangeText={setContactRole} placeholder="Jefa de mantención" />
      <Input label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+56 9 0000 0000" />
      <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="contacto@empresa.cl" />
      <Input label="Dirección" value={address} onChangeText={setAddress} placeholder="Camino a Coronel 2450" />
      <Input label="Comuna / ciudad" value={city} onChangeText={setCity} placeholder="Coronel" />
      <TextArea
        label="Observaciones"
        value={observations}
        onChangeText={setObservations}
        placeholder="Notas internas del cliente"
      />
      <Button label="Guardar cliente" onPress={handleSubmit} loading={submitting} />
    </View>
  );
}
