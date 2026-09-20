import { ListFilter } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { QuietPressable } from '@/components/ui/QuietPressable';
import { SERVICE_TYPE_SHORT } from '@/constants/labels';
import { Colors } from '@/constants/theme';
import type { HistoryFinding } from '@/lib/survey';
import type { ServiceType } from '@/types';

export type ServiceFilter = 'all' | ServiceType;

const SERVICE_OPTIONS: { value: ServiceFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'epoxy', label: SERVICE_TYPE_SHORT.epoxy },
  { value: 'pu_cement', label: SERVICE_TYPE_SHORT.pu_cement },
  { value: 'roof_waterproofing', label: SERVICE_TYPE_SHORT.roof_waterproofing },
  { value: 'corrosion_control', label: SERVICE_TYPE_SHORT.corrosion_control },
];

const FINDING_OPTIONS: { value: HistoryFinding; label: string }[] = [
  { value: 'bad', label: 'Malo / crítico' },
  { value: 'high', label: 'Criticidad alta' },
];

type Props = {
  serviceType: ServiceFilter;
  findings: HistoryFinding[];
  onServiceType: (value: ServiceFilter) => void;
  onFindings: (values: HistoryFinding[]) => void;
  onClear: () => void;
};

export function HistoryFilters({ serviceType, findings, onServiceType, onFindings, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = (serviceType === 'all' ? 0 : 1) + findings.length;
  const active = activeCount > 0;

  return (
    <>
      <QuietPressable
        accessibilityRole="button"
        accessibilityLabel={active ? `Filtros, ${activeCount} activos` : 'Filtros'}
        onPress={() => setOpen(true)}
        style={{
          height: 48,
          flexShrink: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          paddingHorizontal: 16,
          backgroundColor: active ? Colors.ink : Colors.card,
          borderWidth: active ? 0 : 1,
          borderColor: Colors.line,
        }}
      >
        <ListFilter size={16} color={active ? '#FFFFFF' : Colors.ink} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: active ? '#FFFFFF' : Colors.ink }}>
          Filtros{active ? ` · ${activeCount}` : ''}
        </Text>
      </QuietPressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable className="flex-1 justify-end bg-black/40 px-5 pb-10" onPress={() => setOpen(false)}>
          <Pressable className="rounded-3xl bg-white p-5" onPress={() => undefined}>
            <Text className="text-xl font-bold text-ink">Filtrar historial</Text>
            <Text className="mt-2 text-[15px] leading-6 text-muted">
              Tipo de servicio, estado malo o crítico y criticidad alta.
            </Text>
            <View className="mt-5 gap-5">
              <ChoiceChips
                label="Servicio"
                value={serviceType}
                onChange={onServiceType}
                options={SERVICE_OPTIONS}
              />
              <ChoiceChips
                label="Hallazgos"
                values={findings}
                onChange={onFindings}
                options={FINDING_OPTIONS}
              />
            </View>
            <View className="mt-6 gap-3">
              <Button label="Listo" onPress={() => setOpen(false)} />
              {active ? (
                <Button
                  label="Quitar filtros"
                  variant="ghost"
                  onPress={() => {
                    onClear();
                    setOpen(false);
                  }}
                />
              ) : (
                <Button label="Cancelar" variant="ghost" onPress={() => setOpen(false)} />
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
