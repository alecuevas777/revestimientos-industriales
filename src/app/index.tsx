import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { useApp } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { Colors } from '@/constants/theme';
import { href } from '@/lib/nav';

export default function IndexScreen() {
  const { session } = useAuth();
  const { ready } = useApp();

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-8">
        <BrandMark variant="mark" height={72} />
        <ActivityIndicator className="mt-6" size="large" color={Colors.brand} />
      </View>
    );
  }

  return <Redirect href={href(session ? '/(tabs)' : '/login')} />;
}
