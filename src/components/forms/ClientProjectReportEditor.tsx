import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  ClientProjectReportFields,
  type ReportClientFields,
  type ReportProjectFields,
} from '@/components/forms/ClientProjectReportFields';
import { Button } from '@/components/ui/Button';
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

  useEffect(() => {
    setClientFields(fromClient(client));
    setProjectFields(fromProject(project));
  }, [client.id, project.id]);

  return (
    <View className="gap-4">
      <ClientProjectReportFields
        client={clientFields}
        project={projectFields}
        onChangeClient={(patch) => setClientFields((current) => ({ ...current, ...patch }))}
        onChangeProject={(patch) => setProjectFields((current) => ({ ...current, ...patch }))}
      />
      <Button label="Guardar datos del informe" loading={submitting} onPress={() => onSave(clientFields, projectFields)} />
    </View>
  );
}
