import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { signedUrlFor } from '@/remote/photos';
import { initials } from '@/lib/format';

type Props = {
  name: string;
  photoPath?: string;
  previewUri?: string;
  size?: number;
  className?: string;
};

export function ProfileAvatar({ name, photoPath, previewUri, size = 56 }: Props) {
  const [uri, setUri] = useState(previewUri ?? '');

  useEffect(() => {
    if (previewUri) {
      setUri(previewUri);
      return;
    }
    if (!photoPath) {
      setUri('');
      return;
    }
    if (photoPath.startsWith('file:') || photoPath.startsWith('content:') || photoPath.startsWith('http')) {
      setUri(photoPath);
      return;
    }
    let active = true;
    void signedUrlFor(photoPath).then((next) => {
      if (active && next) setUri(next);
    });
    return () => {
      active = false;
    };
  }, [photoPath, previewUri]);

  const dimension = { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' as const };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={dimension}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={previewUri || photoPath}
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-ink"
      style={dimension}
    >
      <Text className="font-bold text-white" style={{ fontSize: Math.max(14, size / 3.2) }}>
        {initials(name)}
      </Text>
    </View>
  );
}
