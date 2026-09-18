import { Copy, Pencil, RotateCcw, Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = {
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onDuplicate?: () => void;
  editLabel?: string;
  deleteLabel?: string;
};

export function CardActions({
  onEdit,
  onDelete,
  onRestore,
  onDuplicate,
  editLabel = 'Editar',
  deleteLabel = 'Eliminar',
}: Props) {
  if (!onEdit && !onDelete && !onRestore && !onDuplicate) return null;

  return (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={editLabel}
          onPress={onEdit}
          className="min-h-[44px] min-w-[30%] flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-line bg-white px-3"
        >
          <Pencil size={15} color={Colors.ink} />
          <Text className="text-sm font-semibold text-ink">{editLabel}</Text>
        </Pressable>
      ) : null}
      {onDuplicate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Duplicar"
          onPress={onDuplicate}
          className="min-h-[44px] min-w-[30%] flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-line bg-white px-3"
        >
          <Copy size={15} color={Colors.ink} />
          <Text className="text-sm font-semibold text-ink">Duplicar</Text>
        </Pressable>
      ) : null}
      {onRestore ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Restaurar"
          onPress={onRestore}
          className="min-h-[44px] min-w-[30%] flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-line bg-white px-3"
        >
          <RotateCcw size={15} color={Colors.ink} />
          <Text className="text-sm font-semibold text-ink">Restaurar</Text>
        </Pressable>
      ) : null}
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
          onPress={onDelete}
          className="min-h-[44px] min-w-[30%] flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-danger-light px-3"
        >
          <Trash2 size={15} color={Colors.danger} />
          <Text className="text-sm font-semibold text-danger">{deleteLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
