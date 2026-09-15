import { Stack } from 'expo-router';

export default function ElementLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F3F5F7' },
      }}
    />
  );
}
