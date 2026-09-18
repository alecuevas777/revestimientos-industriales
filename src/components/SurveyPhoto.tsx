import { Image, type ImageContentFit, type ImageStyle } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View, type StyleProp } from 'react-native';

import { Colors } from '@/constants/theme';
import { signedUrlFor } from '@/remote/photos';
import { localPhotoExists } from '@/services/photoStorage';
import type { PhotoEvidence } from '@/types';

type Props = {
  photo: PhotoEvidence;
  style: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
};

function initialUri(photo: PhotoEvidence) {
  if (photo.uri && !photo.uri.startsWith('http')) return photo.uri;
  if (photo.uri.startsWith('http')) return photo.uri;
  return '';
}

async function resolveUri(photo: PhotoEvidence) {
  if (photo.uri && !photo.uri.startsWith('http') && (await localPhotoExists(photo.uri))) {
    return photo.uri;
  }
  if (photo.storagePath) {
    return (await signedUrlFor(photo.storagePath)) ?? photo.uri;
  }
  return photo.uri;
}

export function SurveyPhoto({ photo, style, contentFit = 'cover' }: Props) {
  const [uri, setUri] = useState(() => initialUri(photo));

  useEffect(() => {
    let active = true;
    setUri(initialUri(photo));
    void resolveUri(photo).then((next) => {
      if (active && next) setUri(next);
    });
    return () => {
      active = false;
    };
  }, [photo.id, photo.uri, photo.storagePath]);

  if (!uri) {
    return (
      <View className="items-center justify-center bg-line" style={style}>
        <Camera size={20} color={Colors.muted} />
      </View>
    );
  }

  return <Image source={{ uri }} style={style} contentFit={contentFit} cachePolicy="memory-disk" recyclingKey={photo.id} />;
}
