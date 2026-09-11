import { Pressable, Text, View } from 'react-native';

type Props = {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
};

export function SelectableCard({ title, description, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[72px] flex-1 rounded-2xl border-2 px-4 py-4 ${selected ? 'border-brand bg-brand-light' : 'border-line bg-white'}`}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={`h-5 w-5 items-center justify-center rounded-full border-2 ${selected ? 'border-brand bg-brand' : 'border-line bg-white'}`}
        >
          {selected ? <View className="h-2 w-2 rounded-full bg-white" /> : null}
        </View>
        <View className="flex-1">
          <Text className={`text-base font-semibold ${selected ? 'text-brand-dark' : 'text-ink'}`}>
            {title}
          </Text>
          {description ? <Text className="mt-1 text-sm text-muted">{description}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}
