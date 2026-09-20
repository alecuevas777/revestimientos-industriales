import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { SurveyCard } from '@/components/SurveyCard';
import { Button } from '@/components/ui/Button';
import { CatalogList } from '@/components/ui/CatalogList';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { WORKER_ROLE } from '@/constants/labels';
import { Colors } from '@/constants/theme';
import { useAppActions, useAppData } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { push } from '@/lib/nav';
import { indexById, surveysForUser } from '@/lib/selectors';
import type { Survey } from '@/types';

export default function ProfileScreen() {
  const { clients, projects, surveys, refreshing } = useAppData();
  const { refreshWorkspace } = useAppActions();
  const { session, logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const worker = session;
  const projectsById = useMemo(() => indexById(projects), [projects]);
  const clientsById = useMemo(() => indexById(clients), [clients]);
  const mine = useMemo(
    () => (worker ? surveysForUser(worker.id, surveys) : []),
    [surveys, worker],
  );
  const drafts = mine.filter((survey) => survey.status === 'draft').length;
  const completed = mine.filter((survey) => survey.status === 'completed').length;
  const visitedClients = useMemo(() => {
    const ids = new Set(
      mine
        .map((survey) => projectsById.get(survey.projectId)?.clientId)
        .filter(Boolean),
    );
    return ids.size;
  }, [mine, projectsById]);

  if (!worker) {
    return null;
  }

  return (
    <Screen scroll={false} padded={false}>
      <CatalogList
        data={mine}
        extraData={`${worker.name}-${worker.phone ?? ''}-${worker.photoPath ?? ''}`}
        keyExtractor={(survey) => survey.id}
        refreshing={refreshing}
        onRefresh={refreshWorkspace}
        header={
          <>
            <ScreenHeader
              title="Perfil"
              subtitle="Ficha del técnico y sus levantamientos"
              right={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Editar perfil"
                  onPress={() => push('/perfil-editar')}
                  className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white"
                >
                  <Pencil size={18} color={Colors.ink} />
                </Pressable>
              }
            />
            <View className="overflow-hidden rounded-2xl border border-line bg-white">
              <View className="h-1 bg-brand" />
              <View className="flex-row items-center gap-4 px-4 py-4">
                <ProfileAvatar name={worker.name} photoPath={worker.photoPath} size={56} />
                <View className="min-w-0 flex-1">
                  <Text className="text-xl font-bold text-ink">{worker.name}</Text>
                  <Text className="mt-0.5 text-sm font-medium text-brand">{worker.role ?? WORKER_ROLE}</Text>
                  <Text className="mt-1 text-sm text-muted">{worker.email}</Text>
                  {worker.phone ? <Text className="mt-0.5 text-sm text-muted">{worker.phone}</Text> : null}
                </View>
              </View>
              <View className="border-t border-line px-4 py-3">
                <Button label="Editar ficha" variant="ghost" onPress={() => push('/perfil-editar')} />
              </View>
            </View>
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-line bg-white px-4 py-3">
                <Text className="text-2xl font-bold text-ink">{completed}</Text>
                <Text className="mt-1 text-sm text-muted">Finalizados</Text>
              </View>
              <View className="flex-1 rounded-2xl border border-line bg-white px-4 py-3">
                <Text className="text-2xl font-bold text-ink">{drafts}</Text>
                <Text className="mt-1 text-sm text-muted">Borradores</Text>
              </View>
              <View className="flex-1 rounded-2xl border border-line bg-white px-4 py-3">
                <Text className="text-2xl font-bold text-ink">{visitedClients}</Text>
                <Text className="mt-1 text-sm text-muted">Clientes</Text>
              </View>
            </View>
            <View className="mt-8">
              <SectionHeader title="Mis levantamientos" />
            </View>
          </>
        }
        empty={
          <EmptyState
            title="Sin levantamientos"
            description="Cuando registres una inspección, quedará asociada a tu perfil."
          />
        }
        renderItem={(survey: Survey) => {
          const project = projectsById.get(survey.projectId);
          const client = project ? clientsById.get(project.clientId) : undefined;
          return (
            <SurveyCard
              survey={survey}
              projectName={project?.name}
              clientName={client?.name}
              location={project?.city}
              technician={worker.name}
              compact
            />
          );
        }}
        footer={
          <View className="gap-3 pb-4">
            <Text className="text-xs font-semibold uppercase tracking-wide text-muted">Aplicación</Text>
            <Text className="text-sm leading-5 text-muted">
              VICAST sincroniza clientes, proyectos, levantamientos y fotos con tu cuenta. Si no hay red, los cambios quedan en este dispositivo y se suben después.
            </Text>
            <Button label="Cerrar sesión" variant="danger" onPress={() => setLogoutOpen(true)} />
          </View>
        }
      />
      <ConfirmModal
        visible={logoutOpen}
        title="¿Cerrar sesión?"
        message="Se cierra la sesión en este dispositivo. Los datos sincronizados quedan en tu cuenta y la copia local se mantiene para el próximo ingreso."
        confirmLabel="Cerrar sesión"
        destructive
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          await logout();
        }}
      />
    </Screen>
  );
}
