import { Building2, ChevronRight, Clock, FileText, Layers, Phone, User } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { CardActions } from '@/components/ui/CardActions';
import { Colors } from '@/constants/theme';
import { useAppActions } from '@/context/AppProvider';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { clientDeleteMessage } from '@/lib/crud';
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
  const { removeClient, restoreClient } = useAppActions();
  const { ask, modal } = useConfirmAction();

  function open() {
    push(`/clientes/${client.id}`);
  }

  return (
    <Card>
      <Pressable onPress={open}>
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl border border-line bg-canvas">
            <Building2 size={22} color={Colors.ink} />
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-base font-bold text-ink">{client.name}</Text>
              <ChevronRight size={18} color={Colors.muted} />
            </View>
            <View className="mt-1.5 flex-row items-center gap-1.5">
              <User size={13} color={Colors.muted} />
              <Text numberOfLines={1} className="flex-1 text-sm text-muted">
                {client.contactName || 'Sin contacto'}
                {client.contactRole ? ` · ${client.contactRole}` : ''}
              </Text>
            </View>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Phone size={13} color={Colors.muted} />
              <Text className="text-sm text-muted">{client.phone || 'Sin teléfono'}</Text>
            </View>
          </View>
        </View>

        <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2">
          <View className="flex-row items-center gap-1.5">
            <Layers size={14} color={Colors.brand} />
            <Text className="text-sm font-semibold text-brand">
              {projectCount} {projectCount === 1 ? 'proyecto' : 'proyectos'}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <FileText size={14} color={Colors.brand} />
            <Text className="text-sm font-semibold text-brand">
              {surveyCount} {surveyCount === 1 ? 'levantamiento' : 'levantamientos'}
            </Text>
          </View>
          {lastActivity ? (
            <View className="flex-row items-center gap-1.5">
              <Clock size={14} color={Colors.muted} />
              <Text className="text-sm text-muted">Última actividad {formatRelative(lastActivity)}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <CardActions
        onEdit={() => push(`/clientes/editar/${client.id}`)}
        onRestore={client.archived ? () => void restoreClient(client.id) : undefined}
        onDelete={() =>
          ask({
            title: '¿Eliminar cliente?',
            message: clientDeleteMessage(projectCount, surveyCount),
            onConfirm: () => removeClient(client.id),
          })
        }
      />
      {modal}
    </Card>
  );
}
