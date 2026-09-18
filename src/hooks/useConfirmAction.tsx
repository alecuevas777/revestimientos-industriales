import { useState, type ReactNode } from 'react';

import { ConfirmModal } from '@/components/ui/ConfirmModal';

type Config = {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
};

export function useConfirmAction() {
  const [config, setConfig] = useState<Config | null>(null);
  const [busy, setBusy] = useState(false);

  function ask(next: Config) {
    setConfig(next);
  }

  const modal: ReactNode = (
    <ConfirmModal
      visible={Boolean(config)}
      title={config?.title ?? ''}
      message={config?.message ?? ''}
      confirmLabel={config?.confirmLabel ?? 'Eliminar'}
      destructive
      loading={busy}
      onCancel={() => {
        if (!busy) setConfig(null);
      }}
      onConfirm={() => {
        void (async () => {
          if (!config || busy) return;
          setBusy(true);
          try {
            await config.onConfirm();
            setConfig(null);
          } finally {
            setBusy(false);
          }
        })();
      }}
    />
  );

  return { ask, modal };
}
