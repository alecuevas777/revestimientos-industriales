import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ProjectForm } from '@/components/forms/ProjectForm';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useApp } from '@/context/AppProvider';
import { useConfirmAction } from '@/hooks/useConfirmAction';
import { projectDeleteMessage } from '@/lib/crud';
import { surveysForProject } from '@/lib/selectors';
import { replace, routeParam } from '@/lib/nav';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProject, clients, surveys, editProject, removeProject } = useApp();
  const project = getProject(routeParam(id) ?? '');
  const [submitting, setSubmitting] = useState(false);
  const { ask, modal } = useConfirmAction();

  if (!project) {
    return (
      <Screen>
        <ScreenHeader title="Editar proyecto" />
        <EmptyState title="Proyecto no encontrado" description="No es posible editar este registro." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Editar proyecto" />
      <ProjectForm
        initial={project}
        clients={clients}
        submitting={submitting}
        onSubmit={async (draft) => {
          setSubmitting(true);
          await editProject(project.id, draft);
          setSubmitting(false);
          router.back();
        }}
      />
      <View className="pb-8">
        <Button
          label="Eliminar proyecto"
          variant="danger"
          onPress={() =>
            ask({
              title: '¿Eliminar proyecto?',
              message: projectDeleteMessage(surveysForProject(project.id, surveys).length),
              onConfirm: async () => {
                await removeProject(project.id);
                replace('/proyectos');
              },
            })
          }
        />
      </View>
      {modal}
    </Screen>
  );
}
