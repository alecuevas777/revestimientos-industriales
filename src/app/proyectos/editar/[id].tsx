import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ProjectForm } from '@/components/forms/ProjectForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useApp } from '@/context/AppProvider';
import { routeParam } from '@/lib/nav';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProject, clients, editProject } = useApp();
  const project = getProject(routeParam(id) ?? '');
  const [submitting, setSubmitting] = useState(false);

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
    </Screen>
  );
}
