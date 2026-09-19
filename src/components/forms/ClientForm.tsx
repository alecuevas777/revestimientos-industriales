import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { emailError, phoneError, rutError } from '@/lib/validate';
import type { Client, ClientDraft } from '@/types';

type Props = {
  initial?: Client;
  submitting?: boolean;
  includeFirstProject?: boolean;
  onSubmit: (draft: ClientDraft, firstProjectName?: string) => void;
};

export function ClientForm({ initial, submitting, includeFirstProject, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [rut, setRut] = useState(initial?.rut ?? '');
  const [contactName, setContactName] = useState(initial?.contactName ?? '');
  const [contactRole, setContactRole] = useState(initial?.contactRole ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [observations, setObservations] = useState(initial?.observations ?? '');
  const [projectName, setProjectName] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    rut?: string;
    phone?: string;
    email?: string;
    project?: string;
  }>({});

  function handleSubmit() {
    const nextErrors = {
      name: name.trim() ? undefined : 'Ingresa el nombre del cliente.',
      rut: rutError(rut),
      phone: phoneError(phone),
      email: emailError(email),
      project: includeFirstProject && !projectName.trim() ? 'Ingresa el nombre del proyecto. Es distinto al del cliente.' : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.rut || nextErrors.phone || nextErrors.email || nextErrors.project) return;

    onSubmit(
      {
        name: name.trim(),
        rut: rut.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactRole: contactRole.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim().toLowerCase() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        observations: observations.trim() || undefined,
      },
      includeFirstProject ? projectName.trim() : undefined,
    );
  }

  return (
    <View className="gap-4 pb-8">
      <Text className="text-sm leading-5 text-muted">
        El cliente es la empresa. Después puede tener varios proyectos, y cada proyecto varios levantamientos.
      </Text>
      <Input
        label="Nombre del cliente"
        hint="Empresa o razón social. No uses el nombre de la planta o del proyecto."
        value={name}
        onChangeText={(value) => {
          setName(value);
          setErrors((current) => ({ ...current, name: undefined }));
        }}
        error={errors.name}
        placeholder="Industrias del Pacífico"
      />
      <Input
        label="RUT (opcional)"
        value={rut}
        onChangeText={(value) => {
          setRut(value);
          setErrors((current) => ({ ...current, rut: undefined }));
        }}
        error={errors.rut}
        placeholder="76.452.110-2"
      />
      <Input
        label="Persona de contacto"
        hint="Nombre de la persona, no de la empresa."
        value={contactName}
        onChangeText={setContactName}
        placeholder="María Soto"
      />
      <Input label="Cargo del contacto (opcional)" value={contactRole} onChangeText={setContactRole} placeholder="Jefa de mantención" />
      <Input
        label="Teléfono"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          setErrors((current) => ({ ...current, phone: undefined }));
        }}
        error={errors.phone}
        keyboardType="phone-pad"
        placeholder="+56 9 0000 0000"
      />
      <Input
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          setErrors((current) => ({ ...current, email: undefined }));
        }}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="contacto@empresa.cl"
      />
      <Input label="Dirección" value={address} onChangeText={setAddress} placeholder="Camino a Coronel 2450" />
      <Input label="Comuna / ciudad" value={city} onChangeText={setCity} placeholder="Coronel" />
      <TextArea
        label="Observaciones"
        value={observations}
        onChangeText={setObservations}
        placeholder="Notas internas del cliente"
      />

      {includeFirstProject ? (
        <View className="mt-2 gap-3 rounded-2xl border border-line bg-white px-4 py-4">
          <Text className="text-base font-semibold text-ink">Primer proyecto</Text>
          <Text className="text-sm leading-5 text-muted">
            Un cliente tiene uno o más proyectos. Este nombre es de la planta o recinto, no de la empresa.
          </Text>
          <Input
            label="Nombre del proyecto"
            hint="Ejemplo: Planta Coronel. Debe ser distinto al nombre del cliente."
            value={projectName}
            onChangeText={(value) => {
              setProjectName(value);
              setErrors((current) => ({ ...current, project: undefined }));
            }}
            error={errors.project}
            placeholder="Planta Coronel"
          />
        </View>
      ) : null}

      <Button label={includeFirstProject ? 'Guardar cliente y proyecto' : 'Guardar cliente'} onPress={handleSubmit} loading={submitting} />
    </View>
  );
}
