import { Camera, CloudOff, ImagePlus, RotateCcw, Trash2, X } from 'lucide-react-native';
import { memo, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SurveyPhoto } from '@/components/SurveyPhoto';
import { Button } from '@/components/ui/Button';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { Input } from '@/components/ui/Input';
import { PHOTO_CATEGORY_LABELS } from '@/constants/labels';
import { Colors } from '@/constants/theme';
import { useAppActions } from '@/context/AppProvider';
import { pickFromLibrary, takePhoto } from '@/lib/pickPhoto';
import { photoUploadStatus } from '@/lib/survey';
import type { PhotoCategory, PhotoEvidence, SurveySector } from '@/types';

type CategoryOption = { value: PhotoCategory; label: string };

type Props = {
  photos: PhotoEvidence[];
  sectors?: SurveySector[];
  categories?: CategoryOption[];
  editable?: boolean;
  onAdd?: (uri: string) => Promise<PhotoEvidence | null | void> | PhotoEvidence | null | void;
  onUpdate?: (id: string, patch: Partial<PhotoEvidence>) => void;
  onRemove?: (id: string) => void;
};

const DEFAULT_CATEGORIES = Object.entries(PHOTO_CATEGORY_LABELS).map(([value, label]) => ({
  value: value as PhotoCategory,
  label,
}));

function PhotoSyncBadge({ photo }: { photo: PhotoEvidence }) {
  const { retryPhotoUpload } = useAppActions();
  const status = photoUploadStatus(photo);
  if (status === 'ready') return null;

  if (status === 'uploading') {
    return (
      <View className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded-full bg-ink/80 px-2 py-1">
        <ActivityIndicator size="small" color="#fff" />
        <Text className="text-[10px] font-semibold text-white">Subiendo</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <Pressable
        onPress={() => retryPhotoUpload(photo.surveyId, photo.id)}
        className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded-full bg-danger px-2 py-1"
      >
        <RotateCcw size={12} color="#fff" />
        <Text className="text-[10px] font-semibold text-white">Reintentar</Text>
      </Pressable>
    );
  }

  return (
    <View className="absolute bottom-2 left-2 flex-row items-center gap-1 rounded-full bg-ink/70 px-2 py-1">
      <CloudOff size={12} color="#fff" />
      <Text className="text-[10px] font-semibold text-white">En el dispositivo</Text>
    </View>
  );
}

function PhotoEditorSheet({
  photo,
  sectors,
  categories,
  editable,
  onClose,
  onUpdate,
  onRemove,
}: {
  photo: PhotoEvidence;
  sectors?: SurveySector[];
  categories: CategoryOption[];
  editable?: boolean;
  onClose: () => void;
  onUpdate?: (id: string, patch: Partial<PhotoEvidence>) => void;
  onRemove?: (id: string) => void;
}) {
  const [caption, setCaption] = useState(photo.caption ?? '');
  const captionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const photoHeight = Math.min(360, Math.round(Dimensions.get('window').height * 0.38));
  const sectorName = photo.sectorId
    ? sectors?.find((item) => item.id === photo.sectorId)?.name || 'Sector'
    : undefined;

  const captionRef = useRef(caption);
  captionRef.current = caption;

  useEffect(() => {
    setCaption(photo.caption ?? '');
  }, [photo.id]);

  useEffect(() => {
    return () => {
      if (captionTimer.current) clearTimeout(captionTimer.current);
      const next = captionRef.current;
      if (onUpdate && next !== (photo.caption ?? '')) {
        onUpdate(photo.id, { caption: next });
      }
    };
  }, [photo.id]);

  function saveCaption() {
    if (captionTimer.current) {
      clearTimeout(captionTimer.current);
      captionTimer.current = null;
    }
    if (onUpdate && caption !== (photo.caption ?? '')) {
      onUpdate(photo.id, { caption });
    }
  }

  function changeCaption(next: string) {
    setCaption(next);
    if (!onUpdate) return;
    if (captionTimer.current) clearTimeout(captionTimer.current);
    captionTimer.current = setTimeout(() => onUpdate(photo.id, { caption: next }), 280);
  }

  function close() {
    saveCaption();
    onClose();
  }

  return (
    <SafeAreaView className="flex-1 bg-ink" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-base font-semibold text-white">Evidencia</Text>
        <Pressable onPress={close} className="h-11 w-11 items-center justify-center" hitSlop={8}>
          <X size={22} color="#fff" />
        </Pressable>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        {photo.uri || photo.storagePath ? (
          <SurveyPhoto photo={photo} style={{ width: '100%', height: photoHeight }} contentFit="contain" />
        ) : (
          <View className="items-center justify-center bg-ink" style={{ height: photoHeight }}>
            <Camera size={28} color="#9CA3AF" />
            <Text className="mt-3 text-sm text-white/70">Fotografía de referencia del demo</Text>
          </View>
        )}

        <View className="flex-1 rounded-t-3xl bg-white">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ gap: 16, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 + insets.bottom }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-sm text-muted">
              {PHOTO_CATEGORY_LABELS[photo.category ?? 'overview']}
              {sectorName ? ` · ${sectorName}` : ''}
            </Text>

            {editable && onUpdate ? (
              <>
                <ChoiceChips
                  label="Categoría"
                  hint="Si no eliges, queda como vista general. La foto se sube igual."
                  options={categories}
                  value={photo.category ?? 'overview'}
                  onChange={(category) => onUpdate(photo.id, { category })}
                />
                <Input
                  label="Nota (opcional)"
                  hint="Puedes dejarla vacía. La foto se guarda y se sube de todos modos."
                  value={caption}
                  onChangeText={changeCaption}
                  placeholder="Qué se observa en esta foto"
                  multiline
                  textAlignVertical="top"
                  className="min-h-[88px] py-3"
                />
                <Button label="Listo" onPress={close} />
              </>
            ) : photo.caption ? (
              <Text className="text-sm leading-5 text-ink">{photo.caption}</Text>
            ) : null}

            {editable && onRemove ? (
              <Pressable
                onPress={() => {
                  onRemove(photo.id);
                  onClose();
                }}
                className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl bg-danger-light"
              >
                <Trash2 size={16} color={Colors.danger} />
                <Text className="text-sm font-semibold text-danger">Eliminar fotografía</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const PhotoGrid = memo(function PhotoGrid({
  photos,
  sectors,
  categories = DEFAULT_CATEGORIES,
  editable,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [added, setAdded] = useState<PhotoEvidence | null>(null);
  const selected = photos.find((photo) => photo.id === openId) ?? (added?.id === openId ? added : undefined);

  async function addAndOpen(pick: () => Promise<string | null>) {
    if (!onAdd) return;
    const uri = await pick();
    if (!uri) return;
    const photo = await onAdd(uri);
    if (!photo) return;
    setAdded(photo);
    setOpenId(photo.id);
  }

  return (
    <View className="gap-3">
      {editable && onAdd ? (
        <View className="gap-3">
          <Button
            label="Tomar fotografía"
            variant="secondary"
            icon={<Camera size={18} color={Colors.brandDark} />}
            onPress={() => void addAndOpen(takePhoto)}
          />
          <Button
            label="Elegir desde galería"
            variant="ghost"
            icon={<ImagePlus size={18} color={Colors.ink} />}
            onPress={() => void addAndOpen(pickFromLibrary)}
          />
        </View>
      ) : null}

      {photos.length === 0 ? (
        <View className="items-center rounded-2xl border border-dashed border-line bg-white py-8">
          <Camera size={24} color={Colors.muted} />
          <Text className="mt-2 text-sm text-muted">Aún no hay fotografías</Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {photos.map((photo, index) => (
            <Pressable
              key={photo.id}
              onPress={() => setOpenId(photo.id)}
              className="w-[48%] overflow-hidden rounded-2xl border border-line bg-white"
            >
              <View>
                <SurveyPhoto photo={photo} style={{ width: '100%', height: 120 }} contentFit="cover" />
                <PhotoSyncBadge photo={photo} />
              </View>
              <View className="px-3 py-2">
                <Text className="text-xs font-semibold text-ink">Foto {String(index + 1).padStart(2, '0')}</Text>
                <Text className="mt-0.5 text-xs text-muted" numberOfLines={1}>
                  {PHOTO_CATEGORY_LABELS[photo.category ?? 'overview']}
                </Text>
                {photo.caption?.trim() ? (
                  <Text className="mt-1 text-xs leading-4 text-ink" numberOfLines={2}>
                    {photo.caption.trim()}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Modal
        visible={Boolean(selected)}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setOpenId(null);
          setAdded(null);
        }}
      >
        {selected ? (
          <PhotoEditorSheet
            photo={selected}
            sectors={sectors}
            categories={categories}
            editable={editable}
            onClose={() => {
              setOpenId(null);
              setAdded(null);
            }}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ) : null}
      </Modal>
    </View>
  );
});
