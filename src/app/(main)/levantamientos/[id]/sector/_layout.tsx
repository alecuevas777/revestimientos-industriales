import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function SectorLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.canvas } }} />;
}

