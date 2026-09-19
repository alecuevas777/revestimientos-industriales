import { View } from 'react-native';

import { ClientProjectReportEditor } from '@/components/forms/ClientProjectReportEditor';
import { ReportGapsBanner } from '@/components/forms/ReportGapsBanner';
import { InfoRow } from '@/components/InfoRow';
import { Card } from '@/components/ui/Card';
import { TextArea } from '@/components/ui/TextArea';
import { SERVICE_TYPE_LABELS } from '@/constants/labels';
import { formatDate, formatTime } from '@/lib/format';
import { clientProjectReportGaps } from '@/lib/reportReady';
import type { Client, ClientDraft, Project, ProjectDraft, Survey } from '@/types';

type Props = {
  survey: Survey;
  project?: Project;
  client?: Client;
  technician: string;
  savingReport?: boolean;
  onChange: (visitReason: string) => void;
  onSaveReport?: (client: ClientDraft, project: ProjectDraft) => void;
};

export function InfoStep({
  survey,
  project,
  client,
  technician,
  savingReport,
  onChange,
  onSaveReport,
}: Props) {
  const missing = clientProjectReportGaps(client, project);

  return (
    <View className="gap-4">
      <Card>
        <InfoRow label="Cliente" value={client?.name} />
        <InfoRow label="Proyecto" value={project?.name} />
        <InfoRow label="Servicio" value={SERVICE_TYPE_LABELS[survey.serviceType]} />
        <InfoRow label="Ubicación" value={project?.location || project?.city} />
        <InfoRow label="Técnico" value={technician} />
        <InfoRow label="Fecha" value={formatDate(survey.startedAt)} />
        <InfoRow label="Hora de inicio" value={formatTime(survey.startedAt)} />
      </Card>

      <ReportGapsBanner missing={missing} />

      {client && project && onSaveReport ? (
        <ClientProjectReportEditor
          client={client}
          project={project}
          submitting={savingReport}
          onSave={(clientFields, projectFields) => {
            const city = projectFields.city?.trim() || clientFields.city?.trim() || undefined;
            onSaveReport(
              {
                name: client.name,
                rut: clientFields.rut?.trim() || undefined,
                contactName: clientFields.contactName?.trim() || undefined,
                contactRole: client.contactRole,
                phone: clientFields.phone?.trim() || undefined,
                email: clientFields.email?.trim() || undefined,
                address: clientFields.address?.trim() || undefined,
                city: clientFields.city?.trim() || city,
                observations: client.observations,
              },
              {
                name: project.name,
                clientId: project.clientId,
                code: project.code,
                address: projectFields.address?.trim() || undefined,
                city,
                location: project.location || city,
                siteContactName: projectFields.siteContactName?.trim() || undefined,
                siteContactPhone: projectFields.siteContactPhone?.trim() || undefined,
                description: project.description,
                status: project.status,
                observations: project.observations,
              },
            );
          }}
        />
      ) : null}

      <TextArea
        label="Motivo / descripción de visita"
        value={survey.visitReason ?? ''}
        onChangeText={onChange}
        placeholder="Evaluación inicial del estado de superficie."
      />
    </View>
  );
}
