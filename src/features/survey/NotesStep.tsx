import { Text, View } from 'react-native';

import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { TextArea } from '@/components/ui/TextArea';
import { YES_NO_OPTIONS } from '@/constants/options';
import type { Survey } from '@/types';

type Props = {
  survey: Survey;
  onChange: (patch: Partial<Survey>) => void;
};

export function NotesStep({ survey, onChange }: Props) {
  return (
    <View className="gap-6">
      <TextArea
        label="Observación general"
        value={survey.generalObservations ?? ''}
        onChangeText={(generalObservations) => onChange({ generalObservations })}
        placeholder="Condición general observada al recorrer el recinto..."
      />

      <TextArea
        label="Conclusión general"
        value={survey.conclusion ?? ''}
        onChangeText={(conclusion) => onChange({ conclusion })}
        placeholder="Se observa deterioro principalmente en áreas de producción y circulación de grúa horquilla."
      />

      <View className="gap-4">
        <Text className="text-base font-semibold text-ink">Condiciones de ejecución / terreno</Text>
        <ChoiceChips
          label="¿La planta se encuentra operativa?"
          options={YES_NO_OPTIONS}
          value={survey.plantOperational}
          onChange={(plantOperational) => onChange({ plantOperational })}
        />
        <ChoiceChips
          label="¿Existen restricciones de horario?"
          options={YES_NO_OPTIONS}
          value={survey.scheduleRestrictions}
          onChange={(scheduleRestrictions) => onChange({ scheduleRestrictions })}
        />
        <TextArea
          label="Observaciones de acceso"
          value={survey.accessNotes ?? ''}
          onChangeText={(accessNotes) => onChange({ accessNotes })}
          placeholder="Acceso únicamente después de las 18:00."
        />
        <ChoiceChips
          label="¿Existe maquinaria que deba retirarse?"
          options={YES_NO_OPTIONS}
          value={survey.machineryToRemove}
          onChange={(machineryToRemove) => onChange({ machineryToRemove })}
        />
        <TextArea
          label="Otros comentarios"
          value={survey.siteComments ?? ''}
          onChangeText={(siteComments) => onChange({ siteComments })}
          placeholder="Coordinar retiro parcial de pallets en pasillo central."
        />
      </View>
    </View>
  );
}
