import { Search } from 'lucide-react-native';
import { TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({ value, onChangeText, placeholder = 'Buscar' }: Props) {
  return (
    <View className="min-h-[48px] flex-row items-center gap-3 rounded-full border border-line bg-white px-4">
      <Search size={20} color={Colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        className="flex-1 py-3 text-base text-ink"
      />
    </View>
  );
}
