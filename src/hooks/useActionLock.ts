import { useRef } from 'react';

export function useActionLock() {
  const locked = useRef(false);

  return async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (locked.current) return undefined;
    locked.current = true;
    try {
      return await action();
    } finally {
      locked.current = false;
    }
  };
}
