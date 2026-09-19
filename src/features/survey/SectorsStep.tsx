import { Text, View } from 'react-native';

import { SectorCard } from '@/components/SectorCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatArea } from '@/lib/format';
import { push } from '@/lib/nav';
import { surveyArea } from '@/lib/service';
import { surveyNeedsSector } from '@/lib/survey';
import type { Survey } from '@/types';

type Props = {
  survey: Survey;
  error?: string;
  onAdd: () => void;
  onDuplicate?: (sectorId: string) => void;
  onRemove?: (sectorId: string) => void;
};

export function SectorsStep({ survey, error, onAdd, onDuplicate, onRemove }: Props) {
  const required = surveyNeedsSector(survey);
  const total = surveyArea(survey);
  const sectorsArea = survey.sectors.reduce((sum, sector) => sum + (sector.approximateArea ?? 0), 0);

  return (
    <View className="gap-4">
      <Text className="text-sm leading-5 text-muted">
        {required
          ? 'Registra cada sector o punto crítico con su estado, problemas y evidencia. La superficie de cada zona es un desglose de la superficie total de la visita.'
          : 'Puedes agregar sectores para documentar zonas específicas. La superficie total ya está en Condiciones; aquí solo se reparte por zona si aplica.'}
      </Text>
      {total || sectorsArea ? (
        <Text className="text-sm leading-5 text-ink">
          {total ? `Total de la visita: ${formatArea(total)}` : null}
          {total && sectorsArea ? ' · ' : null}
          {sectorsArea ? `Suma de sectores: ${formatArea(sectorsArea)}` : null}
        </Text>
      ) : null}
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
      <Button label="+ Agregar sector" onPress={onAdd} />
      {survey.sectors.length === 0 ? (
        <EmptyState
          title="Sin sectores"
          description={
            required
              ? 'Agrega al menos un sector o punto crítico antes de finalizar.'
              : 'Aún no registras sectores en este levantamiento.'
          }
        />
      ) : (
        survey.sectors.map((item, index) => (
          <SectorCard
            key={item.id}
            sector={item}
            index={index}
            serviceType={survey.serviceType}
            onPress={() => push(`/levantamientos/${survey.id}/sector/${item.id}`)}
            onDuplicate={onDuplicate ? () => onDuplicate(item.id) : undefined}
            onDelete={onRemove ? () => onRemove(item.id) : undefined}
          />
        ))
      )}
    </View>
  );
}
