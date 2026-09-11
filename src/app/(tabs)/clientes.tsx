import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { ClientCard } from '@/components/ClientCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChips } from '@/components/ui/FilterChips';
import { ProfileButton } from '@/components/ui/ProfileButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { useApp } from '@/context/AppProvider';
import { lastClientActivity, surveysForClient } from '@/lib/selectors';

type Filter = 'active' | 'archived';

export default function ClientsScreen() {
  const { clients, projects, surveys } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('active');

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
    <Screen bottomSafe={false}>
      <ScreenHeader title="Clientes" back={false} right={<ProfileButton />} />
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
        <Button label="+ Nuevo cliente" onPress={() => router.push('/clientes/nuevo')} />
      </View>
      <View className="mt-5 gap-3">
        {filtered.length === 0 ? (
          <EmptyState
            title={query ? 'Sin resultados' : filter === 'archived' ? 'No hay clientes archivados' : 'Aún no hay clientes'}
            description={
              query
                ? 'Prueba con otro nombre, contacto o teléfono.'
                : 'Crea el primer cliente para asociar proyectos.'
            }
            action={
              query || filter === 'archived' ? undefined : (
                <Button label="+ Nuevo cliente" onPress={() => router.push('/clientes/nuevo')} />
              )
            }
          />
        ) : (
          filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              projectCount={projects.filter((project) => project.clientId === client.id).length}
              surveyCount={surveysForClient(client.id, projects, surveys).length}
              lastActivity={lastClientActivity(client, projects, surveys)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
