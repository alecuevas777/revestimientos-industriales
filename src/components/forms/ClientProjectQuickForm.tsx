import { useState } from 'react';
import { Text, View } from 'react-native';

import { ClientProjectReportFields, type ReportClientFields, type ReportProjectFields } from '@/components/forms/ClientProjectReportFields';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { contactFieldErrors, hasFieldErrors } from '@/lib/validate';
import type { ClientProjectSetup } from '@/types';

type Props = {
  submitting?: boolean;
  onSubmit: (setup: ClientProjectSetup) => void;
};

export function ClientProjectQuickForm({ submitting, onSubmit }: Props) {
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [client, setClient] = useState<ReportClientFields>({});
  const [project, setProject] = useState<ReportProjectFields>({});
  const [errors, setErrors] = useState<{
    client?: string;
    project?: string;
    rut?: string;
    phone?: string;
    email?: string;
    siteContactPhone?: string;
  }>({});

  function handleSubmit() {
    const nextErrors = {
      client: clientName.trim() ? undefined : 'Ingresa el nombre del cliente.',
      project: projectName.trim() ? undefined : 'Ingresa el nombre del proyecto.',
      ...contactFieldErrors({
        rut: client.rut,
        phone: client.phone,
        email: client.email,
        siteContactPhone: project.siteContactPhone,
      }),
    };
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;

    const city = project.city?.trim() || client.city?.trim() || undefined;
    const address = project.address?.trim() || client.address?.trim() || undefined;
    onSubmit({
      client: {
        name: clientName.trim(),
        rut: client.rut?.trim() || undefined,
        contactName: client.contactName?.trim() || undefined,
        phone: client.phone?.trim() || undefined,
        email: client.email?.trim().toLowerCase() || undefined,
        address: client.address?.trim() || address,
        city: client.city?.trim() || city,
      },
      project: {
        name: projectName.trim(),
        address,
        city,
        location: city,
        siteContactName: project.siteContactName?.trim() || undefined,
        siteContactPhone: project.siteContactPhone?.trim() || undefined,
        status: 'active',
      },
    });
  }

  return (
    <View className="gap-5">
      <Text className="text-sm leading-5 text-muted">
        El cliente es la empresa. El proyecto es la planta o recinto. Estos datos se usan después en el informe PDF.
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
      </View>

      <ClientProjectReportFields
        client={client}
        project={project}
        errors={errors}
        onChangeClient={(patch) => {
          setClient((current) => ({ ...current, ...patch }));
          setErrors((current) => ({
            ...current,
            rut: patch.rut !== undefined ? undefined : current.rut,
            phone: patch.phone !== undefined ? undefined : current.phone,
            email: patch.email !== undefined ? undefined : current.email,
          }));
        }}
        onChangeProject={(patch) => {
          setProject((current) => ({ ...current, ...patch }));
          if (patch.siteContactPhone !== undefined) {
            setErrors((current) => ({ ...current, siteContactPhone: undefined }));
          }
        }}
      />

      <Button label="Crear y continuar" onPress={handleSubmit} loading={submitting} />
    </View>
  );
}
