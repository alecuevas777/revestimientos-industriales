import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'android_ripple' | 'style'> & {
  style?: StyleProp<ViewStyle>;
};

function clearWebFocus() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const active = document.activeElement;
  if (active instanceof HTMLElement) active.blur();
}

export function QuietPressable({ style, onPress, onPressOut, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      android_ripple={{ color: 'transparent', foreground: false, borderless: true }}
      unstable_pressDelay={0}
      onPress={(event) => {
        clearWebFocus();
        onPress?.(event);
      }}
      onPressOut={(event) => {
        clearWebFocus();
        onPressOut?.(event);
      }}
      style={style}
    />
  );
}
