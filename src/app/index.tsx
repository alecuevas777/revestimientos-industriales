import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useApp } from '@/context/AppProvider';
import { href } from '@/lib/nav';

export default function IndexScreen() {
  const { ready, session } = useApp();

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    );
  }

  return <Redirect href={href(session ? '/(tabs)' : '/login')} />;
}
