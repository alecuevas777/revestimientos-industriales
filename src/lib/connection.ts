import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { Platform } from 'react-native';

function browserOffline() {
  return Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function isOnlineState(state: NetInfoState) {
  if (browserOffline()) return false;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export async function fetchOnline() {
  if (browserOffline()) return false;
  return isOnlineState(await NetInfo.fetch());
}

export function subscribeConnection(listener: (online: boolean) => void) {
  const notify = (state?: NetInfoState) => {
    if (browserOffline()) {
      listener(false);
      return;
    }
    if (state) {
      listener(isOnlineState(state));
      return;
    }
    void NetInfo.fetch().then((next) => listener(isOnlineState(next)));
  };

  const unsubscribe = NetInfo.addEventListener((state) => notify(state));

  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return unsubscribe;
  }

  const onBrowserChange = () => notify();
  window.addEventListener('online', onBrowserChange);
  window.addEventListener('offline', onBrowserChange);

  return () => {
    unsubscribe();
    window.removeEventListener('online', onBrowserChange);
    window.removeEventListener('offline', onBrowserChange);
  };
}
