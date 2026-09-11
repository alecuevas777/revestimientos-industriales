import { View } from 'react-native';

import { InfoRow } from '@/components/InfoRow';
import { Card } from '@/components/ui/Card';
import { TextArea } from '@/components/ui/TextArea';
import { formatDate, formatTime } from '@/lib/format';
import type { Client, Project, Survey } from '@/types';

type Props = {
  survey: Survey;
  project?: Project;
  client?: Client;
  technician: string;
  onChange: (visitReason: string) => void;
};

export function InfoStep({ survey, project, client, technician, onChange }: Props) {
  return (
    <View className="gap-4">
      <Card>
        <InfoRow label="Cliente" value={client?.name} />
        <InfoRow label="Proyecto" value={project?.name} />
        <InfoRow label="Ubicación" value={project?.location || project?.city} />
        <InfoRow label="Técnico" value={technician} />
        <InfoRow label="Fecha" value={formatDate(survey.startedAt)} />
        <InfoRow label="Hora de inicio" value={formatTime(survey.startedAt)} />
      </Card>
      <TextArea
        label="Motivo / descripción de visita"
        value={survey.visitReason ?? ''}
        onChangeText={onChange}
        placeholder="Evaluación inicial del estado de superficie."
      />
    </View>
  );
}
