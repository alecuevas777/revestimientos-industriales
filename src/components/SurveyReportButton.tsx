import { useState } from 'react';
import { Alert } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useAppActions } from '@/context/AppProvider';
import { useActionLock } from '@/hooks/useActionLock';
import { clientProjectReportGaps } from '@/lib/reportReady';
import { shareSurveyReport, surveyReportWarnings } from '@/services/surveyReport';
import type { Client, Project, Survey } from '@/types';

type Props = {
  survey: Survey;
  client?: Client;
  project?: Project;
  technician: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  label?: string;
};

export function SurveyReportButton({
  survey,
  client,
  project,
  technician,
  variant = 'primary',
  label = 'Generar informe PDF',
}: Props) {
  const { showToast } = useAppActions();
  const [loading, setLoading] = useState(false);
  const run = useActionLock();

  async function handlePress() {
    await run(async () => {
      setLoading(true);
      try {
        const gaps = clientProjectReportGaps(client, project);
        const warnings = surveyReportWarnings({ survey, client, project, technician });
        await shareSurveyReport({ survey, client, project, technician });
        if (gaps.length) {
          showToast(`Informe listo. Faltan: ${gaps.slice(0, 2).join(', ')}${gaps.length > 2 ? '…' : ''}`);
        } else if (warnings[0]) {
          showToast(warnings[0]);
        } else {
          showToast('Informe PDF listo para compartir');
        }
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        if (message.toLowerCase().includes('cancel') || message.toLowerCase().includes('did not share')) {
          return;
        }
        Alert.alert('No se pudo generar el informe', message || 'Inténtalo de nuevo en un momento.', [{ text: 'Entendido' }]);
      } finally {
        setLoading(false);
      }
    });
  }

  return <Button label={label} variant={variant} loading={loading} onPress={() => void handlePress()} />;
}
