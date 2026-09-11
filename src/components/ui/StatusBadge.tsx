import { Text, View } from 'react-native';

import {
  CONDITION_LABELS,
  PROJECT_STATUS_LABELS,
  SEVERITY_LABELS,
  SURVEY_STATUS_LABELS,
} from '@/constants/labels';
import type { ProjectStatus, Severity, SurfaceCondition, SurveyStatus } from '@/types';

const projectBg: Record<ProjectStatus, string> = {
  active: 'bg-success-light',
  pending: 'bg-warning-light',
  finished: 'bg-line',
};

const projectText: Record<ProjectStatus, string> = {
  active: 'text-success',
  pending: 'text-warning',
  finished: 'text-muted',
};

const conditionBg: Record<SurfaceCondition, string> = {
  good: 'bg-success-light',
  regular: 'bg-warning-light',
  bad: 'bg-orange-50',
  critical: 'bg-danger-light',
};

const conditionText: Record<SurfaceCondition, string> = {
  good: 'text-success',
  regular: 'text-warning',
  bad: 'text-orange-700',
  critical: 'text-danger',
};

const severityBorder: Record<Severity, string> = {
  low: 'border-success',
  medium: 'border-warning',
  high: 'border-orange-600',
  critical: 'border-danger',
};

const severityText: Record<Severity, string> = {
  low: 'text-success',
  medium: 'text-warning',
  high: 'text-orange-700',
  critical: 'text-danger',
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <View className={`self-start rounded-full px-3 py-1.5 ${projectBg[status]}`}>
      <Text className={`text-[13px] font-semibold ${projectText[status]}`}>
        {PROJECT_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

export function ConditionBadge({ condition }: { condition: SurfaceCondition }) {
  return (
    <View className={`self-start rounded-full px-3 py-1.5 ${conditionBg[condition]}`}>
      <Text className={`text-[13px] font-semibold ${conditionText[condition]}`}>
        {CONDITION_LABELS[condition]}
      </Text>
    </View>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <View className={`self-start rounded-full border px-3 py-1.5 bg-white ${severityBorder[severity]}`}>
      <Text className={`text-[13px] font-semibold ${severityText[severity]}`}>
        Criticidad {SEVERITY_LABELS[severity].toLowerCase()}
      </Text>
    </View>
  );
}

export function SurveyStatusBadge({ status }: { status: SurveyStatus }) {
  const draft = status === 'draft';
  return (
    <View className={`self-start rounded-full px-3 py-1.5 ${draft ? 'bg-warning-light' : 'bg-success-light'}`}>
      <Text className={`text-[13px] font-semibold ${draft ? 'text-warning' : 'text-success'}`}>
        {SURVEY_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}
