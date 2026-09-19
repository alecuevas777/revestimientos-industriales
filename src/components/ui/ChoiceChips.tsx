import { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { QuietPressable } from '@/components/ui/QuietPressable';
import { Colors } from '@/constants/theme';

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
};

type Common<T extends string> = {
  options: ChoiceOption<T>[];
  label?: string;
  hint?: string;
};

type SingleProps<T extends string> = Common<T> & {
  value?: T;
  values?: never;
  onChange: (value: T) => void;
};

type MultiProps<T extends string> = Common<T> & {
  values: T[];
  value?: never;
  onChange: (values: T[]) => void;
};

export function FieldLabel({ label, hint }: { label?: string; hint?: string }) {
  if (!label && !hint) return null;
  return (
    <View style={styles.labelBox}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function ChoiceChipsInner<T extends string>(props: SingleProps<T> | MultiProps<T>) {
  const multi = Boolean(props.values);
  const incomingKey = multi ? (props.values ?? []).join('|') : (props.value ?? '');
  const [pickedKey, setPickedKey] = useState(incomingKey);

  useEffect(() => {
    setPickedKey(incomingKey);
  }, [incomingKey]);

  const picked = pickedKey ? (pickedKey.split('|') as T[]) : [];

  function press(option: T) {
    if (multi) {
      const next = picked.includes(option) ? picked.filter((item) => item !== option) : [...picked, option];
      setPickedKey(next.join('|'));
      (props as MultiProps<T>).onChange(next);
      return;
    }
    setPickedKey(option);
    (props as SingleProps<T>).onChange(option);
  }

  return (
    <View style={styles.wrap}>
      <FieldLabel label={props.label} hint={props.hint} />
      <View style={styles.row}>
        {props.options.map((option) => {
          const active = multi ? picked.includes(option.value) : pickedKey === option.value;
          return (
            <QuietPressable key={option.value} onPress={() => press(option.value)}>
              <View style={[styles.chip, active ? styles.chipOn : styles.chipOff]}>
                <Text style={[styles.chipText, active ? styles.chipTextOn : styles.chipTextOff]}>
                  {option.label}
                </Text>
              </View>
            </QuietPressable>
          );
        })}
      </View>
    </View>
  );
}

export const ChoiceChips = memo(ChoiceChipsInner) as typeof ChoiceChipsInner;

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  labelBox: { gap: 4 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  hint: { fontSize: 14, lineHeight: 20, color: Colors.muted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    flexShrink: 0,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  chipOn: { backgroundColor: Colors.brand },
  chipOff: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  chipTextOn: { color: '#FFFFFF' },
  chipTextOff: { color: Colors.ink },
});
