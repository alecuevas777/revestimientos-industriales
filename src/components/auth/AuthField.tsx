import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  icon: LucideIcon;
  error?: string;
  hint?: string;
  password?: boolean;
};

export function AuthField({ icon: Icon, error, hint, password, ...props }: Props) {
  const [hidden, setHidden] = useState(Boolean(password));

  return (
    <View>
      <View
        className={`min-h-[54px] flex-row items-center rounded-full border bg-black/45 px-4 ${
          error ? 'border-danger' : 'border-white/15'
        }`}
      >
        <Icon size={18} color="#A1A1AA" />
        <TextInput
          placeholderTextColor="#A1A1AA"
          selectionColor="#F96706"
          className="flex-1 px-3 py-3 text-base text-white"
          {...props}
          secureTextEntry={password ? hidden : false}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            hitSlop={8}
            onPress={() => setHidden((value) => !value)}
          >
            {hidden ? <EyeOff size={18} color="#A1A1AA" /> : <Eye size={18} color="#A1A1AA" />}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="mt-2 px-2 text-sm text-red-400">{error}</Text>
      ) : hint ? (
        <Text className="mt-2 px-2 text-sm text-white/60">{hint}</Text>
      ) : null}
    </View>
  );
}
