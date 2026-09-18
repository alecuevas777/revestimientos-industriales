import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { InfoRow } from '@/components/InfoRow';
import { ProjectCard } from '@/components/ProjectCard';
import { StatCard } from '@/components/StatCard';
import { SurveyCard } from '@/components/SurveyCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppProvider';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { clientDeleteMessage } from '@/lib/crud';
import { completedOf, lastProjectSurveyAt, projectsForClient, surveysForClient } from '@/lib/selectors';
import { push, replace, routeParam } from '@/lib/nav';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getClient, projects, surveys, archiveClient, restoreClient, removeClient } = useApp();
  const client = getClient(routeParam(id) ?? '');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const { ask, modal } = useConfirmAction();

  if (!client) {
    return (
      <Screen>
        <ScreenHeader title="Cliente" />
        <EmptyState title="Cliente no encontrado" description="Es posible que haya sido eliminado." />
      </Screen>
    );
  }

  const clientProjects = projectsForClient(client.id, projects);
  const clientSurveys = surveysForClient(client.id, projects, surveys);
  const recent = completedOf(clientSurveys).slice(0, 3);

  return (
    <Screen>
      <ScreenHeader
        title={client.name}
        right={
          <Pressable
            onPress={() => push(`/clientes/editar/${client.id}`)}
            className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white"
          >
            <Pencil size={18} color={Colors.ink} />
          </Pressable>
        }
      />

      <Card>
        <InfoRow label="Contacto" value={client.contactName} />
        <InfoRow label="Cargo" value={client.contactRole} />
        <InfoRow label="Teléfono" value={client.phone} />
        <InfoRow label="Email" value={client.email} />
        <InfoRow label="Dirección" value={[client.address, client.city].filter(Boolean).join(', ')} />
        <InfoRow label="Observaciones" value={client.observations} />
      </Card>

      <View className="mt-4 flex-row gap-3">
        <StatCard label="Proyectos" value={clientProjects.length} />
        <StatCard label="Levantamientos" value={clientSurveys.length} />
      </View>

      <View className="mt-6 gap-3">
        <SectionHeader title="Proyectos" />
        <Button
          label="+ Nuevo proyecto"
          icon={<Plus size={18} color="#fff" />}
          onPress={() => router.push({ pathname: '/proyectos/nuevo', params: { clientId: client.id } })}
        />
        {clientProjects.length === 0 ? (
          <EmptyState title="Sin proyectos" description="Crea un proyecto para este cliente." />
        ) : (
          clientProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              clientName={client.name}
              surveyCount={surveys.filter((survey) => survey.projectId === project.id).length}
              lastSurveyAt={lastProjectSurveyAt(project.id, surveys)}
            />
          ))
        )}
      </View>

      <View className="mt-8 gap-3">
        <SectionHeader title="Actividad reciente" />
        {recent.length === 0 ? (
          <EmptyState title="Sin actividad" description="Aún no hay levantamientos finalizados para este cliente." />
        ) : (
          recent.map((survey) => {
            const project = projects.find((item) => item.id === survey.projectId);
            return <SurveyCard key={survey.id} survey={survey} projectName={project?.name} compact />;
          })
        )}
      </View>

      <View className="mt-8 gap-3 pb-4">
        {client.archived ? (
          <Button label="Restaurar cliente" variant="secondary" onPress={() => void restoreClient(client.id)} />
        ) : (
          <Button label="Archivar cliente" variant="ghost" onPress={() => setArchiveOpen(true)} />
        )}
        <Button
          label="Eliminar cliente"
          variant="danger"
          onPress={() =>
            ask({
              title: '¿Eliminar cliente?',
              message: clientDeleteMessage(clientProjects.length, clientSurveys.length),
              onConfirm: async () => {
                await removeClient(client.id);
                replace('/clientes');
              },
            })
          }
        />
      </View>

      <ConfirmModal
        visible={archiveOpen}
        title="¿Archivar cliente?"
        message="El cliente dejará de aparecer en el listado principal. Sus proyectos y levantamientos se mantienen."
        confirmLabel="Archivar"
        destructive
        onCancel={() => setArchiveOpen(false)}
        onConfirm={async () => {
          setArchiveOpen(false);
          await archiveClient(client.id);
          replace('/clientes');
        }}
      />
      {modal}
    </Screen>
  );
}
