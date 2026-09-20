import { Camera, ChevronRight, ClipboardList, Layers, MapPin } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { CardActions } from '@/components/ui/CardActions';
import { ConditionBadge, SeverityBadge } from '@/components/ui/StatusBadge';
import { SERVICE_TYPE_SHORT } from '@/constants/labels';
import { Colors } from '@/constants/theme';
import { useAppActions } from '@/context/AppProvider';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { formatRelative } from '@/lib/format';
import { push } from '@/lib/nav';
import { elementCount, maxCondition, maxSeverity, photoCount } from '@/lib/survey';
import type { Survey } from '@/types';

type Props = {
  survey: Survey;
  projectName?: string;
  clientName?: string;
  location?: string;
  compact?: boolean;
  technician?: string;
};

export function SurveyCard({
  survey,
  projectName,
  clientName,
  location,
  compact,
  technician,
}: Props) {
  const { discardSurvey } = useAppActions();
  const { ask, modal } = useConfirmAction();
  const photos = photoCount(survey);
  const elements = elementCount(survey);
  const worstCondition = maxCondition(survey);
  const highestSeverity = maxSeverity(survey);
  const showCondition = worstCondition === 'bad' || worstCondition === 'critical';
  const showSeverity = highestSeverity === 'high' || highestSeverity === 'critical';
  const place = [clientName, location].filter(Boolean).join(' · ');
  const editorHref = `/levantamientos/${survey.id}/editar`;
  const detailHref = `/levantamientos/${survey.id}`;

  function open() {
    push(survey.status === 'draft' ? editorHref : detailHref);
  }

  return (
    <Card>
      <Pressable onPress={open}>
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl border border-line bg-canvas">
            <ClipboardList size={22} color={Colors.ink} />
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-base font-bold text-ink">{survey.code}</Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-row items-center gap-1.5">
                  <View
                    className={`h-2 w-2 rounded-full ${survey.status === 'completed' ? 'bg-success' : 'bg-warning'}`}
                  />
                  <Text className="text-sm font-medium text-ink">
                    {survey.status === 'completed' ? 'Finalizado' : 'Borrador'}
                  </Text>
                </View>
                <ChevronRight size={18} color={Colors.muted} />
              </View>
            </View>
            {projectName ? (
              <Text numberOfLines={1} className="mt-1.5 text-sm text-muted">
                {projectName}
              </Text>
            ) : null}
            {place ? (
              <View className="mt-1 flex-row items-center gap-1.5">
                <MapPin size={13} color={Colors.muted} />
                <Text numberOfLines={1} className="flex-1 text-sm text-muted">
                  {place}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="mt-4 flex-row flex-wrap items-center gap-x-4 gap-y-2">
          <Text className="text-sm font-semibold text-brand">{SERVICE_TYPE_SHORT[survey.serviceType]}</Text>
          {showCondition && worstCondition ? <ConditionBadge condition={worstCondition} /> : null}
          {showSeverity && highestSeverity ? <SeverityBadge severity={highestSeverity} /> : null}
          <View className="flex-row items-center gap-1.5">
            <Layers size={14} color={Colors.brand} />
            <Text className="text-sm font-semibold text-brand">
              {elements > 0
                ? `${elements} ${elements === 1 ? 'elemento' : 'elementos'}`
                : `${survey.sectors.length} ${survey.sectors.length === 1 ? 'sector' : 'sectores'}`}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Camera size={14} color={Colors.muted} />
            <Text className="text-sm text-muted">
              {photos} {photos === 1 ? 'foto' : 'fotos'}
            </Text>
          </View>
        </View>
        {!compact ? (
          <Text className="mt-2 text-sm text-muted">
            {technician ? `Técnico: ${technician} · ` : ''}
            {formatRelative(survey.completedAt ?? survey.updatedAt)}
          </Text>
        ) : null}
      </Pressable>
      <CardActions
        editLabel={survey.status === 'draft' ? 'Editar' : 'Ver / editar'}
        onEdit={open}
        onDelete={() =>
          ask({
            title: '¿Eliminar levantamiento?',
            message: 'Se borrará este registro. Esta acción no se puede deshacer.',
            onConfirm: () => discardSurvey(survey.id),
          })
        }
      />
      {modal}
    </Card>
  );
}
