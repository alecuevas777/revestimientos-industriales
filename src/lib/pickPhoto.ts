import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import { pauseHydrate, resumeHydrate } from '@/lib/hydrateGate';

async function withHydratePaused<T>(action: () => Promise<T>) {
  pauseHydrate();
  try {
    return await action();
  } finally {
    resumeHydrate();
  }
}

export async function pickFromLibrary() {
  return withHydratePaused(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Activa el acceso a la galería para agregar fotografías.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      exif: false,
    });

    return result.canceled ? null : result.assets[0]?.uri ?? null;
  });
}

export async function takePhoto() {
  return withHydratePaused(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Activa la cámara para fotografiar la superficie.');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      exif: false,
    });

    return result.canceled ? null : result.assets[0]?.uri ?? null;
  });
}

export function choosePhotoSource(onUri: (uri: string) => void) {
  Alert.alert('Agregar fotografía', 'Elige el origen de la imagen', [
    {
      text: 'Cámara',
      onPress: async () => {
        const uri = await takePhoto();
        if (uri) onUri(uri);
      },
    },
    {
      text: 'Galería',
      onPress: async () => {
        const uri = await pickFromLibrary();
        if (uri) onUri(uri);
      },
    },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}
