import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/theme';
import { formatRelative } from '@/lib/format';
import { push } from '@/lib/nav';
import type { Client } from '@/types';

type Props = {
  client: Client;
  projectCount: number;
  surveyCount: number;
  lastActivity?: string;
};

export function ClientCard({ client, projectCount, surveyCount, lastActivity }: Props) {
  return (
    <Pressable onPress={() => push(`/clientes/${client.id}`)}>
      <Card>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-semibold text-ink">{client.name}</Text>
            <Text className="mt-1 text-sm text-muted">
              {client.contactName || 'Sin contacto'}
              {client.contactRole ? ` · ${client.contactRole}` : ''}
            </Text>
            <Text className="mt-1 text-sm text-muted">{client.phone || 'Sin teléfono'}</Text>
            <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
              <Text className="text-sm font-medium text-brand">
                {projectCount} {projectCount === 1 ? 'proyecto' : 'proyectos'}
              </Text>
              <Text className="text-sm font-medium text-brand">
                {surveyCount} {surveyCount === 1 ? 'levantamiento' : 'levantamientos'}
              </Text>
            </View>
            {lastActivity ? (
              <Text className="mt-2 text-xs text-muted">Última actividad {formatRelative(lastActivity)}</Text>
            ) : null}
          </View>
          <ChevronRight size={20} color={Colors.muted} />
        </View>
      </Card>
    </Pressable>
  );
}
