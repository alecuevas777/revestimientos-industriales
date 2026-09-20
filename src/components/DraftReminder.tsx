import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { formatRelative } from '@/lib/format';
import { push } from '@/lib/nav';
import { readDraftReminder, saveDraftReminder, shouldShowDraftReminder } from '@/storage/draftReminder';
import type { Project, Survey } from '@/types';

type Props = {
  userId?: string;
  ready: boolean;
  drafts: Survey[];
  projects: Project[];
};

export function DraftReminder({ userId, ready, drafts, projects }: Props) {
  const [open, setOpen] = useState(false);
  const closedForKey = useRef<string | null>(null);
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  const latest = drafts[0];
  const draftKey = drafts
    .map((survey) => survey.id)
    .sort()
    .join(',');
  const projectName = latest ? projects.find((project) => project.id === latest.projectId)?.name : undefined;

  useEffect(() => {
    if (!ready || !userId || !draftKey) {
      setOpen(false);
      return;
    }
    if (closedForKey.current === draftKey) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        const ids = draftKey.split(',').filter(Boolean);
        const state = await readDraftReminder(userId);
        if (cancelled) return;
        if (!shouldShowDraftReminder(state, ids)) {
          closedForKey.current = draftKey;
          return;
        }
        setOpen(true);
      })();
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draftKey, ready, userId]);

  async function dismiss() {
    const ids = draftsRef.current.map((survey) => survey.id);
    if (userId) await saveDraftReminder(userId, ids);
    closedForKey.current = draftKey;
    setOpen(false);
  }

  if (!latest) return null;

  const several = drafts.length > 1;
  const title = several
    ? `Tienes ${drafts.length} levantamientos sin finalizar`
    : 'Tienes un levantamiento sin finalizar';
  const where = projectName ? ` en ${projectName}` : '';
  const message = several
    ? `El más reciente es ${latest.code}${where}. Última modificación ${formatRelative(latest.updatedAt)}.`
    : `${latest.code}${where}. Última modificación ${formatRelative(latest.updatedAt)}.`;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={() => void dismiss()}
    >
      <Pressable className="flex-1 justify-end bg-black/40 px-5 pb-10" onPress={() => void dismiss()}>
        <Pressable className="rounded-3xl bg-white p-5" onPress={() => undefined}>
          <Text className="text-[13px] font-semibold uppercase tracking-[1.4px] text-warning">Borradores</Text>
          <Text className="mt-2 text-xl font-bold text-ink">{title}</Text>
          <Text className="mt-2 text-[15px] leading-6 text-muted">{message}</Text>
          <View className="mt-6 gap-3">
            <Button
              label={several ? 'Continuar el más reciente' : 'Continuar'}
              onPress={() => {
                void dismiss().then(() => push(`/levantamientos/${latest.id}/editar`));
              }}
            />
            {several ? (
              <Button
                label="Ver todos"
                variant="secondary"
                onPress={() => {
                  void dismiss().then(() => push('/levantamientos?estado=borradores'));
                }}
              />
            ) : null}
            <Button label="Ahora no" variant="ghost" onPress={() => void dismiss()} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
