import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  ClientProjectReportFields,
  type ReportClientFields,
  type ReportProjectFields,
} from '@/components/forms/ClientProjectReportFields';
import { Button } from '@/components/ui/Button';
import { contactFieldErrors, hasFieldErrors } from '@/lib/validate';
import type { Client, Project } from '@/types';

type Props = {
  client: Client;
  project: Project;
  submitting?: boolean;
  onSave: (client: ReportClientFields, project: ReportProjectFields) => void;
};

function fromClient(client: Client): ReportClientFields {
  return {
    rut: client.rut,
    contactName: client.contactName,
    phone: client.phone,
    email: client.email,
    address: client.address,
    city: client.city,
  };
}

function fromProject(project: Project): ReportProjectFields {
  return {
    address: project.address,
    city: project.city,
    siteContactName: project.siteContactName,
    siteContactPhone: project.siteContactPhone,
  };
}

export function ClientProjectReportEditor({ client, project, submitting, onSave }: Props) {
  const [clientFields, setClientFields] = useState(() => fromClient(client));
  const [projectFields, setProjectFields] = useState(() => fromProject(project));
  const [errors, setErrors] = useState<ReturnType<typeof contactFieldErrors>>({});

  useEffect(() => {
    setClientFields(fromClient(client));
    setProjectFields(fromProject(project));
    setErrors({});
  }, [client.id, project.id]);

  function handleSave() {
    const nextErrors = contactFieldErrors({
      rut: clientFields.rut,
      phone: clientFields.phone,
      email: clientFields.email,
      siteContactPhone: projectFields.siteContactPhone,
    });
    setErrors(nextErrors);
    if (hasFieldErrors(nextErrors)) return;
    onSave(
      {
        ...clientFields,
        email: clientFields.email?.trim().toLowerCase(),
      },
      projectFields,
    );
  }

  return (
    <View className="gap-4">
      <ClientProjectReportFields
        client={clientFields}
        project={projectFields}
        errors={errors}
        onChangeClient={(patch) => {
          setClientFields((current) => ({ ...current, ...patch }));
          setErrors((current) => ({
            ...current,
            rut: patch.rut !== undefined ? undefined : current.rut,
            phone: patch.phone !== undefined ? undefined : current.phone,
            email: patch.email !== undefined ? undefined : current.email,
          }));
        }}
        onChangeProject={(patch) => {
          setProjectFields((current) => ({ ...current, ...patch }));
          if (patch.siteContactPhone !== undefined) {
            setErrors((current) => ({ ...current, siteContactPhone: undefined }));
          }
        }}
      />
      <Button label="Guardar datos del informe" loading={submitting} onPress={handleSave} />
    </View>
  );
}
