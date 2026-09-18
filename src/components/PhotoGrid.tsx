import { Camera, CloudOff, ImagePlus, RotateCcw, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SurveyPhoto } from '@/components/SurveyPhoto';
import { Button } from '@/components/ui/Button';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
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
  onAdd?: (uri: string) => void;
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

export function PhotoGrid({ photos, sectors, categories = DEFAULT_CATEGORIES, editable, onAdd, onUpdate, onRemove }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = photos.find((photo) => photo.id === openId);

  return (
    <View className="gap-3">
      {editable && onAdd ? (
        <View className="gap-3">
          <Button
            label="Tomar fotografía"
            variant="secondary"
            icon={<Camera size={18} color={Colors.brandDark} />}
            onPress={async () => {
              const uri = await takePhoto();
              if (uri) onAdd(uri);
            }}
          />
          <Button
            label="Elegir desde galería"
            variant="ghost"
            icon={<ImagePlus size={18} color={Colors.ink} />}
            onPress={async () => {
              const uri = await pickFromLibrary();
              if (uri) onAdd(uri);
            }}
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
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <Modal visible={Boolean(selected)} animationType="fade" onRequestClose={() => setOpenId(null)}>
        <SafeAreaView className="flex-1 bg-ink">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-base font-semibold text-white">Evidencia</Text>
            <Pressable onPress={() => setOpenId(null)} className="h-11 w-11 items-center justify-center">
              <X size={22} color="#fff" />
            </Pressable>
          </View>
          {selected ? (
            <View className="flex-1">
              {selected.uri || selected.storagePath ? (
                <SurveyPhoto photo={selected} style={{ flex: 1 }} contentFit="contain" />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Camera size={28} color="#9CA3AF" />
                  <Text className="mt-3 text-sm text-white/70">Fotografía de referencia del demo</Text>
                </View>
              )}
              <View className="gap-3 bg-white px-5 py-5">
                <Text className="text-sm text-muted">
                  {PHOTO_CATEGORY_LABELS[selected.category ?? 'overview']}
                  {selected.sectorId
                    ? ` · ${sectors?.find((item) => item.id === selected.sectorId)?.name || 'Sector'}`
                    : ''}
                </Text>
                {editable && onUpdate ? (
                  <>
                    <ChoiceChips
                      label="Categoría"
                      options={categories}
                      value={selected.category ?? 'overview'}
                      onChange={(category) => onUpdate(selected.id, { category })}
                    />
                    <TextInput
                      value={selected.caption ?? ''}
                      onChangeText={(caption) => onUpdate(selected.id, { caption })}
                      placeholder="Fisura longitudinal próxima a junta del sector norte."
                      placeholderTextColor="#9CA3AF"
                      className="min-h-[48px] rounded-xl border border-line px-3 text-sm text-ink"
                    />
                  </>
                ) : selected.caption ? (
                  <Text className="text-sm leading-5 text-ink">{selected.caption}</Text>
                ) : null}
                {editable && onRemove ? (
                  <Pressable
                    onPress={() => {
                      onRemove(selected.id);
                      setOpenId(null);
                    }}
                    className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl bg-danger-light"
                  >
                    <Trash2 size={16} color={Colors.danger} />
                    <Text className="text-sm font-semibold text-danger">Eliminar fotografía</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
