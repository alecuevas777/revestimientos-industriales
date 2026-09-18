import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ClientCard } from '@/components/ClientCard';
import { TabBrandHeader } from '@/components/TabBrandHeader';
import { Button } from '@/components/ui/Button';
import { CatalogList } from '@/components/ui/CatalogList';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { Screen } from '@/components/ui/Screen';
import { SearchInput } from '@/components/ui/SearchInput';
import { useAppActions, useAppData } from '@/context/AppProvider';
import { lastActivityByClientId, projectCountByClientId, surveyCountByClientId } from '@/lib/selectors';
import type { Client } from '@/types';

type Filter = 'active' | 'archived';

export default function ClientsScreen() {
  const { clients, projects, surveys, refreshing } = useAppData();
  const { refreshWorkspace } = useAppActions();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('active');

  const projectCounts = useMemo(() => projectCountByClientId(projects), [projects]);
  const surveyCounts = useMemo(() => surveyCountByClientId(projects, surveys), [projects, surveys]);
  const lastActivity = useMemo(
    () => lastActivityByClientId(clients, projects, surveys),
    [clients, projects, surveys],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesArchive = filter === 'archived' ? client.archived : !client.archived;
      const matchesQuery = [client.name, client.contactName, client.phone, client.email, client.city]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
      return matchesArchive && matchesQuery;
    });
  }, [clients, filter, query]);

  return (
    <Screen scroll={false} padded={false}>
      <CatalogList
        data={filtered}
        extraData={`${filter}:${query}:${projects.length}:${surveys.length}`}
        keyExtractor={(client) => client.id}
        refreshing={refreshing}
        onRefresh={refreshWorkspace}
        header={
          <>
            <TabBrandHeader title="Clientes" subtitle="Gestiona tu cartera y revisa su actividad" />
            <View className="gap-3">
              <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar cliente, contacto o teléfono" />
              <FilterChips
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'active', label: 'Activos' },
                  { value: 'archived', label: 'Archivados' },
                ]}
              />
              <Button
                label="Nuevo cliente"
                className="rounded-full"
                icon={<Plus size={18} color="#fff" />}
                onPress={() => router.push('/clientes/nuevo')}
              />
            </View>
          </>
        }
        empty={
          <EmptyState
            title={query ? 'Sin resultados' : filter === 'archived' ? 'No hay clientes archivados' : 'Aún no hay clientes'}
            description={
              query
                ? 'Prueba con otro nombre, contacto o teléfono.'
                : 'Crea el primer cliente para asociar proyectos.'
            }
            action={
              query || filter === 'archived' ? undefined : (
                <Button
                  label="Nuevo cliente"
                  className="rounded-full"
                  icon={<Plus size={18} color="#fff" />}
                  onPress={() => router.push('/clientes/nuevo')}
                />
              )
            }
          />
        }
        renderItem={(client: Client) => (
          <ClientCard
            client={client}
            projectCount={projectCounts.get(client.id) ?? 0}
            surveyCount={surveyCounts.get(client.id) ?? 0}
            lastActivity={lastActivity.get(client.id)}
          />
        )}
      />
    </Screen>
  );
}
