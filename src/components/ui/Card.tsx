import { View, type ViewProps } from 'react-native';

type Props = ViewProps & {
  padded?: boolean;
};

export function Card({ className, padded = true, children, style, ...props }: Props) {
  return (
    <View
      className={`rounded-2xl border border-line bg-white ${padded ? 'p-4' : ''} ${className ?? ''}`}
      style={[
        {
          shadowColor: '#0F172A',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
