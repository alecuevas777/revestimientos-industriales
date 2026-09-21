import { View } from 'react-native';

import { SurveyReportButton } from '@/components/SurveyReportButton';
import type { Client, Project, Survey } from '@/types';

type Props = {
  survey: Survey;
  client?: Client;
  project?: Project;
  technician: string;
  pdfLabel?: string;
  excelLabel?: string;
  pdfVariant?: 'primary' | 'secondary' | 'ghost';
  excelVariant?: 'primary' | 'secondary' | 'ghost';
};

export function SurveyExportButtons({
  survey,
  client,
  project,
  technician,
  pdfLabel = 'Compartir informe PDF',
  excelLabel = 'Compartir Excel',
  pdfVariant = 'secondary',
  excelVariant = 'ghost',
}: Props) {
  return (
    <View className="gap-3">
      <SurveyReportButton
        survey={survey}
        client={client}
        project={project}
        technician={technician}
        format="pdf"
        variant={pdfVariant}
        label={pdfLabel}
      />
      <SurveyReportButton
        survey={survey}
        client={client}
        project={project}
        technician={technician}
        format="excel"
        variant={excelVariant}
        label={excelLabel}
      />
    </View>
  );
}
