import { MapPin } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors } from '@/constants/theme';
import { formatRelative } from '@/lib/format';
import { push } from '@/lib/nav';
import type { Project } from '@/types';

type Props = {
  project: Project;
  clientName: string;
  surveyCount: number;
  lastSurveyAt?: string;
};

export function ProjectCard({ project, clientName, surveyCount, lastSurveyAt }: Props) {
  return (
    <Pressable onPress={() => push(`/proyectos/${project.id}`)}>
      <Card>
        <View className="flex-row items-start justify-between gap-3">
          <Text className="flex-1 text-base font-semibold text-ink">{project.name}</Text>
          <StatusBadge status={project.status} />
        </View>
        <Text className="mt-2 text-sm text-muted">{clientName}</Text>
        {project.location || project.city ? (
          <View className="mt-2 flex-row items-center gap-1.5">
            <MapPin size={14} color={Colors.muted} />
            <Text className="text-sm text-muted">{project.location || project.city}</Text>
          </View>
        ) : null}
        <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
          <Text className="text-sm font-medium text-brand">
            {surveyCount} {surveyCount === 1 ? 'levantamiento' : 'levantamientos'}
          </Text>
          <Text className="text-sm text-muted">
            {lastSurveyAt ? `Último ${formatRelative(lastSurveyAt)}` : 'Sin levantamientos'}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
