import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export function useEditorTick() {
  const [, setTick] = useState(0);
  const tick = useCallback(() => setTick((current) => current + 1), []);

  useFocusEffect(
    useCallback(() => {
      tick();
    }, [tick]),
  );

  return tick;
}
