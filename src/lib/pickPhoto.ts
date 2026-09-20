import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import { pauseHydrate, resumeHydrate } from '@/lib/hydrateGate';

async function withHydratePaused<T>(action: () => Promise<T>) {
  pauseHydrate();
  try {
    return await action();
  } finally {
    resumeHydrate();
  }
}

function permissionDenied(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
  ]);
}

function pickerFailed(message: string) {
  Alert.alert('No se pudo agregar la foto', message, [{ text: 'Entendido' }]);
}

export async function pickFromLibrary() {
  return withHydratePaused(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        permissionDenied(
          'Permiso de galería',
          'Activa el acceso a tus fotos en Ajustes para adjuntar evidencia al levantamiento.',
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        exif: false,
      });

      return result.canceled ? null : result.assets[0]?.uri ?? null;
    } catch {
      pickerFailed('No se pudo abrir la galería. Inténtalo de nuevo.');
      return null;
    }
  });
}

export async function takePhoto() {
  return withHydratePaused(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        permissionDenied(
          'Permiso de cámara',
          'Activa la cámara en Ajustes para fotografiar la superficie.',
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        exif: false,
      });

      return result.canceled ? null : result.assets[0]?.uri ?? null;
    } catch {
      pickerFailed('No se pudo abrir la cámara. Comprueba el permiso e inténtalo de nuevo.');
      return null;
    }
  });
}

export function chooseProfilePhoto(onUri: (uri: string) => void) {
  Alert.alert('Foto de perfil', 'Elige de dónde quieres sacar la imagen.', [
    {
      text: 'Cámara',
      onPress: () => {
        void takeProfilePhoto().then((uri) => {
          if (uri) onUri(uri);
        });
      },
    },
    {
      text: 'Galería',
      onPress: () => {
        void pickProfileFromLibrary().then((uri) => {
          if (uri) onUri(uri);
        });
      },
    },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

async function pickProfileFromLibrary() {
  return withHydratePaused(async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        permissionDenied(
          'Permiso de galería',
          'Activa el acceso a tus fotos en Ajustes para cambiar la foto de perfil.',
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [1, 1],
        exif: false,
      });

      return result.canceled ? null : result.assets[0]?.uri ?? null;
    } catch {
      pickerFailed('No se pudo abrir la galería. Inténtalo de nuevo.');
      return null;
    }
  });
}

async function takeProfilePhoto() {
  return withHydratePaused(async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        permissionDenied('Permiso de cámara', 'Activa la cámara en Ajustes para tomar la foto de perfil.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.85,
        allowsEditing: true,
        aspect: [1, 1],
        exif: false,
      });

      return result.canceled ? null : result.assets[0]?.uri ?? null;
    } catch {
      pickerFailed('No se pudo abrir la cámara. Comprueba el permiso e inténtalo de nuevo.');
      return null;
    }
  });
}

export function choosePhotoSource(onUri: (uri: string) => void) {
  Alert.alert('Agregar fotografía', 'Elige de dónde quieres sacar la imagen.', [
    {
      text: 'Cámara',
      onPress: () => {
        void takePhoto().then((uri) => {
          if (uri) onUri(uri);
        });
      },
    },
    {
      text: 'Galería',
      onPress: () => {
        void pickFromLibrary().then((uri) => {
          if (uri) onUri(uri);
        });
      },
    },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}
