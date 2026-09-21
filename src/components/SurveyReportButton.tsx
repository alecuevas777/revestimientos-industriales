import { useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppActions } from '@/context/AppProvider';
import { useActionLock } from '@/hooks/useActionLock';
import { clientProjectReportGaps } from '@/lib/reportReady';
import { shareSurveyExcel } from '@/services/surveyExcel';
import { shareSurveyReport, surveyReportWarnings } from '@/services/surveyReport';
import type { Client, Project, Survey } from '@/types';

type Props = {
  survey: Survey;
  client?: Client;
  project?: Project;
  technician: string;
  format?: 'pdf' | 'excel';
  variant?: 'primary' | 'secondary' | 'ghost';
  label?: string;
};

export function SurveyReportButton({
  survey,
  client,
  project,
  technician,
  format = 'pdf',
  variant = 'primary',
  label,
}: Props) {
  const { showToast } = useAppActions();
  const [loading, setLoading] = useState(false);
  const run = useActionLock();
  const actionLabel = label ?? (format === 'excel' ? 'Compartir Excel' : 'Generar informe PDF');

  async function handlePress() {
    await run(async () => {
      setLoading(true);
      try {
        const input = { survey, client, project, technician };
        const gaps = clientProjectReportGaps(client, project);
        const warnings = surveyReportWarnings(input);
        if (format === 'excel') {
          await shareSurveyExcel(input);
        } else {
          await shareSurveyReport(input);
        }
        if (gaps.length) {
          showToast(`Informe listo. Faltan: ${gaps.slice(0, 2).join(', ')}${gaps.length > 2 ? '…' : ''}`);
        } else if (warnings[0]) {
          showToast(warnings[0]);
        } else {
          showToast(format === 'excel' ? 'Excel listo para compartir' : 'Informe PDF listo para compartir');
        }
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        if (message.toLowerCase().includes('cancel') || message.toLowerCase().includes('did not share')) {
          return;
        }
        Alert.alert(
          format === 'excel' ? 'No se pudo generar el Excel' : 'No se pudo generar el informe',
          message || 'Inténtalo de nuevo en un momento.',
          [{ text: 'Entendido' }],
        );
      } finally {
        setLoading(false);
      }
    });
  }

  return <Button label={actionLabel} variant={variant} loading={loading} onPress={() => void handlePress()} />;
}
