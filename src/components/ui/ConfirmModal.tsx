import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 justify-end bg-black/40 px-5 pb-10" onPress={onCancel}>
        <Pressable className="rounded-3xl bg-white p-5" onPress={() => undefined}>
          <Text className="text-xl font-bold text-ink">{title}</Text>
          <Text className="mt-2 text-[15px] leading-6 text-muted">{message}</Text>
          <View className="mt-5 gap-3">
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
            />
            <Button label={cancelLabel} variant="ghost" onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
