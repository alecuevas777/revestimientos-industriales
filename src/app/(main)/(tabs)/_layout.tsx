import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function TabsLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.canvas } }} />;
}
