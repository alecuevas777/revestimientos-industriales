import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  bottomSafe?: boolean;
};

export function Screen({ children, scroll = true, padded = true, bottomSafe = true }: Props) {
  const content = (
    <View className={`flex-1 ${padded ? 'px-5 py-4' : ''}`}>{children}</View>
  );

  return (
    <SafeAreaView
      className="flex-1 bg-canvas"
      edges={bottomSafe ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={bottomSafe ? 'grow pb-6' : 'grow pb-24'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
