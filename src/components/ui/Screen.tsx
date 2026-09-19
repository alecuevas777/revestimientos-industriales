import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { keyboardAvoidingBehavior } from '@/lib/keyboard';

type Props = {
  children: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  bottomSafe?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({
  children,
  footer,
  overlay,
  scroll = true,
  padded = true,
  bottomSafe = true,
  refreshing = false,
  onRefresh,
}: Props) {
  const content = (
    <View className={`${scroll ? '' : 'flex-1'} ${padded ? 'px-5 py-4' : ''}`.trim()}>{children}</View>
  );

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Colors.brand}
      colors={[Colors.brand]}
    />
  ) : undefined;

  return (
    <SafeAreaView
      className="flex-1 bg-canvas"
      edges={bottomSafe ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={keyboardAvoidingBehavior}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={bottomSafe ? 'grow pb-6' : 'grow pb-24'}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
          >
            {content}
          </ScrollView>
        ) : (
          <View className="flex-1">{content}</View>
        )}
        {footer ? <View className={padded ? 'px-5 pb-3' : 'pb-3'}>{footer}</View> : null}
      </KeyboardAvoidingView>
      {overlay}
    </SafeAreaView>
  );
}
