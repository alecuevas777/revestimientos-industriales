import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_FOOTER, APP_NAME_FULL, APP_TAGLINE, BrandImages } from '@/constants/brand';
import { keyboardAvoidingBehavior } from '@/lib/keyboard';

type Props = {
  titleLead: string;
  titleAccent: string;
  subtitle: string;
  notice?: string;
  align?: 'center' | 'start';
  stackedTitle?: boolean;
  children: ReactNode;
};

export function AuthScreen({
  titleLead,
  titleAccent,
  subtitle,
  notice,
  align = 'center',
  stackedTitle = false,
  children,
}: Props) {
  const start = align === 'start';

  return (
    <View className="flex-1 bg-ink">
      <StatusBar style="light" />
      <Image
        accessibilityIgnoresInvertColors
        source={BrandImages.loginBg}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <View className="absolute inset-0 bg-black/55" />

      <SafeAreaView className="flex-1" edges={['top', 'left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={keyboardAvoidingBehavior}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            className="flex-1"
            contentContainerClassName="grow justify-between px-6 py-4"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            <View>
              <View className="items-center pt-2">
                <Image
                  accessibilityLabel={APP_NAME_FULL}
                  source={BrandImages.logo}
                  style={{ width: 176, height: 76 }}
                  contentFit="contain"
                />
                <Text className="mt-3 text-[11px] font-semibold uppercase tracking-[2.4px] text-white/70">
                  {APP_TAGLINE}
                </Text>
              </View>

              <View className={`mt-8 ${start ? 'items-start' : 'items-center'}`}>
                {stackedTitle ? (
                  <>
                    <Text className="text-center text-[36px] font-bold leading-10 text-white">{titleLead}</Text>
                    <Text className="text-center text-[36px] font-bold leading-10 text-brand">{titleAccent}</Text>
                  </>
                ) : (
                  <Text
                    className={`text-[36px] font-bold leading-10 text-white ${start ? 'text-left' : 'text-center'}`}
                  >
                    {titleLead} <Text className="text-brand">{titleAccent}</Text>
                  </Text>
                )}
                <Text
                  className={`mt-3 text-base leading-6 text-white/80 ${start ? 'text-left' : 'text-center'}`}
                >
                  {subtitle}
                </Text>
                {notice ? (
                  <Text className="mt-3 text-sm font-medium leading-5 text-brand">{notice}</Text>
                ) : null}
              </View>

              <View className="mt-7">{children}</View>
            </View>

            <View className="mt-8 items-center pb-2">
              <Text className="text-center text-[11px] font-semibold uppercase tracking-[2.2px] text-white/55">
                {APP_FOOTER}
              </Text>
              <View className="mt-3 h-0.5 w-10 rounded-full bg-brand" />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
