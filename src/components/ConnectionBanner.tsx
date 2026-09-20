import { Text, View } from 'react-native';

import { useAppData } from '@/context/AppProvider';

const COPY = {
  offline: {
    box: 'bg-warning-light',
    title: 'text-warning',
    heading: 'Sin conexión',
    body: 'El trabajo queda en este dispositivo.',
  },
  syncing: {
    box: 'bg-brand-light',
    title: 'text-brand',
    heading: 'Subiendo cambios',
    body: 'Se están sincronizando con tu cuenta.',
  },
  synced: {
    box: 'bg-success-light',
    title: 'text-success',
    heading: 'Cambios subidos',
    body: 'Ya quedaron en tu cuenta.',
  },
} as const;

export function ConnectionBanner({ className = 'px-5 pt-3' }: { className?: string }) {
  const { connectionNotice } = useAppData();
  if (!connectionNotice) return null;
  const copy = COPY[connectionNotice];

  return (
    <View className={className}>
      <View className={`rounded-2xl px-4 py-3 ${copy.box}`}>
        <Text className={`text-sm font-semibold ${copy.title}`}>{copy.heading}</Text>
        <Text className="mt-0.5 text-[13px] leading-5 text-ink">{copy.body}</Text>
      </View>
    </View>
  );
}
