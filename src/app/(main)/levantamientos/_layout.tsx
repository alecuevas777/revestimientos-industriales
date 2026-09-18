import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function SurveysLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.canvas } }}
    />
  );
}

