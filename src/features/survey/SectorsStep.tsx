import { Text, View } from 'react-native';

import { SectorCard } from '@/components/SectorCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { push } from '@/lib/nav';
import { surveyNeedsSector } from '@/lib/survey';
import type { Survey } from '@/types';

type Props = {
  survey: Survey;
  error?: string;
  onAdd: () => void;
  onDuplicate?: (sectorId: string) => void;
};

export function SectorsStep({ survey, error, onAdd, onDuplicate }: Props) {
  const required = surveyNeedsSector(survey);

  return (
    <View className="gap-4">
      <Text className="text-sm leading-5 text-muted">
        {required
          ? 'Registra cada sector o punto crítico con su estado, problemas y evidencia.'
          : 'Puedes agregar sectores para documentar zonas específicas, aunque el alcance sea de superficie completa.'}
      </Text>
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
          />
        ))
      )}
    </View>
  );
}
