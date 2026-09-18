import { Building2, ChevronRight, Clock, Factory, Layers, MapPin, Warehouse } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { PROJECT_STATUS_LABELS } from '@/constants/labels';
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

const statusDot: Record<Project['status'], string> = {
  active: 'bg-success',
  pending: 'bg-warning',
  finished: 'bg-muted',
};

function ProjectGlyph({ name }: { name: string }) {
  const text = name.toLowerCase();
  const Icon = text.includes('bodega') || text.includes('logíst') || text.includes('centro') ? Warehouse : Factory;
  return <Icon size={22} color={Colors.ink} />;
}

export function ProjectCard({ project, clientName, surveyCount, lastSurveyAt }: Props) {
  const place = [project.city, project.location].filter(Boolean).join(', ');

  return (
    <Pressable onPress={() => push(`/proyectos/${project.id}`)}>
      <Card>
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-xl border border-line bg-canvas">
            <ProjectGlyph name={project.name} />
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-base font-bold text-ink">{project.name}</Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-row items-center gap-1.5">
                  <View className={`h-2 w-2 rounded-full ${statusDot[project.status]}`} />
                  <Text className="text-sm font-medium text-ink">{PROJECT_STATUS_LABELS[project.status]}</Text>
                </View>
                <ChevronRight size={18} color={Colors.muted} />
              </View>
            </View>
            <View className="mt-1.5 flex-row items-center gap-1.5">
              <Building2 size={13} color={Colors.muted} />
              <Text numberOfLines={1} className="flex-1 text-sm text-muted">
                {clientName}
              </Text>
            </View>
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
          <View className="flex-row items-center gap-1.5">
            <Layers size={14} color={Colors.brand} />
            <Text className="text-sm font-semibold text-brand">
              {surveyCount} {surveyCount === 1 ? 'levantamiento' : 'levantamientos'}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Clock size={14} color={Colors.muted} />
            <Text className="text-sm text-muted">
              {lastSurveyAt ? `Último ${formatRelative(lastSurveyAt)}` : 'Sin levantamientos'}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
