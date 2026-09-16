import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { SurveyCard } from '@/components/SurveyCard';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { WORKER_ROLE } from '@/constants/labels';
import { useApp } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { initials } from '@/lib/format';
import { surveysForUser } from '@/lib/selectors';

export default function ProfileScreen() {
  const { resetDemoData, clients, projects, surveys } = useApp();
  const { session, logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const worker = session;
  const mine = useMemo(
    () => (worker ? surveysForUser(worker.id, surveys) : []),
    [surveys, worker],
  );
  const drafts = mine.filter((survey) => survey.status === 'draft').length;
  const completed = mine.filter((survey) => survey.status === 'completed').length;
  const visitedClients = useMemo(() => {
    const ids = new Set(
      mine
        .map((survey) => projects.find((project) => project.id === survey.projectId)?.clientId)
        .filter(Boolean),
    );
    return ids.size;
  }, [mine, projects]);

  if (!worker) {
    return null;
  }

  return (
    <Screen>
      <ScreenHeader title="Perfil" subtitle="Ficha del técnico y sus levantamientos" />

      <View className="flex-row items-center gap-4 rounded-2xl border border-line bg-white px-4 py-4">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-brand">
          <Text className="text-lg font-bold text-white">{initials(worker.name)}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-xl font-bold text-ink">{worker.name}</Text>
          <Text className="mt-0.5 text-sm font-medium text-brand">{worker.role ?? WORKER_ROLE}</Text>
          <Text className="mt-1 text-sm text-muted">{worker.email}</Text>
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

      <View className="mt-8 gap-3">
        <SectionHeader title="Mis levantamientos" />
        {mine.length === 0 ? (
          <EmptyState
            title="Sin levantamientos"
            description="Cuando registres una inspección, quedará asociada a tu perfil."
          />
        ) : (
          mine.map((survey) => {
            const project = projects.find((item) => item.id === survey.projectId);
            const client = project ? clients.find((item) => item.id === project.clientId) : undefined;
            return (
              <SurveyCard
                key={survey.id}
                survey={survey}
                projectName={project?.name}
                clientName={client?.name}
                location={project?.city}
                technician={worker.name}
                compact
              />
            );
          })
        )}
      </View>

      <View className="mt-8 gap-3 pb-4">
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted">Aplicación</Text>
        <Text className="text-sm leading-5 text-muted">
          Modo demo local. Los datos quedan en este dispositivo y los levantamientos se asocian a tu usuario.
        </Text>
        <Button label="Restablecer datos demo" variant="ghost" onPress={() => setResetOpen(true)} />
        <Button label="Cerrar sesión" variant="danger" onPress={() => setLogoutOpen(true)} />
      </View>

      <ConfirmModal
        visible={resetOpen}
        title="¿Restablecer datos demo?"
        message="Se volverán a cargar clientes, proyectos y levantamientos de demostración. Los cambios locales se perderán."
        confirmLabel="Restablecer"
        destructive
        onCancel={() => setResetOpen(false)}
        onConfirm={async () => {
          setResetOpen(false);
          await resetDemoData();
        }}
      />

      <ConfirmModal
        visible={logoutOpen}
        title="¿Cerrar sesión?"
        message="Se cierra la sesión de Supabase en este dispositivo. Los clientes y levantamientos guardados aquí se mantienen."
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
