import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { SurveyExportButtons } from '@/components/SurveyExportButtons';
import { TabBrandHeader } from '@/components/TabBrandHeader';
import { Card } from '@/components/ui/Card';
import { CatalogList } from '@/components/ui/CatalogList';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SearchInput } from '@/components/ui/SearchInput';
import { SERVICE_TYPE_SHORT } from '@/constants/labels';
import { Colors } from '@/constants/theme';
import { useAppActions, useAppData } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatDate } from '@/lib/format';
import { push } from '@/lib/nav';
import { indexById } from '@/lib/selectors';
import {
  isOfflineError,
  listCompletedSurveys,
  listTeamMembers,
  loadCatalogForSurveys,
  type TeamMember,
} from '@/remote';
import type { Client, Project, Survey, User } from '@/types';

type MemberRow = {
  member: TeamMember;
  surveys: Survey[];
};

function memberFromSession(session: User): TeamMember {
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    photoPath: session.photoPath,
    active: true,
  };
}

function mergeByUpdatedAt<T extends { id: string; updatedAt?: string }>(primary: T[], extra: T[]) {
  const map = new Map<string, T>();
  for (const item of primary) map.set(item.id, item);
  for (const item of extra) {
    const current = map.get(item.id);
    if (!current || (item.updatedAt ?? '') >= (current.updatedAt ?? '')) {
      map.set(item.id, item);
    }
  }
  return [...map.values()];
}

function assembleMembers(fetched: TeamMember[], session: User | null, surveys: Survey[]) {
  const byId = new Map<string, TeamMember>();
  for (const member of fetched) {
    if (member.active || member.id === session?.id) byId.set(member.id, member);
  }
  if (session) {
    const existing = byId.get(session.id);
    byId.set(
      session.id,
      existing
        ? {
            ...existing,
            name: existing.name || session.name,
            email: existing.email || session.email,
            photoPath: existing.photoPath || session.photoPath,
            active: true,
          }
        : memberFromSession(session),
    );
  }
  for (const survey of surveys) {
    if (byId.has(survey.userId)) continue;
    const listed = fetched.find((member) => member.id === survey.userId);
    byId.set(
      survey.userId,
      listed ?? {
        id: survey.userId,
        name: 'Técnico',
        email: '',
        active: true,
      },
    );
  }
  return [...byId.values()];
}

function completedSurveys(surveys: Survey[]) {
  return surveys.filter((survey) => survey.status === 'completed');
}

function TeamSurveyRow({
  survey,
  project,
  client,
  technician,
}: {
  survey: Survey;
  project?: Project;
  client?: Client;
  technician: string;
}) {
  return (
    <View className="rounded-2xl border border-line bg-canvas px-4 py-3">
      <Pressable onPress={() => push(`/levantamientos/${survey.id}`)} className="min-h-[48px]">
        <View className="flex-row items-start justify-between gap-2">
          <View className="min-w-0 flex-1">
            <Text className="text-base font-bold text-ink">{survey.code}</Text>
            <Text numberOfLines={1} className="mt-1 text-sm text-muted">
              {project?.name || 'Recinto'}
              {client?.name ? ` · ${client.name}` : ''}
            </Text>
            <Text className="mt-1 text-sm font-semibold text-brand">
              {SERVICE_TYPE_SHORT[survey.serviceType]}
              {survey.completedAt ? ` · ${formatDate(survey.completedAt)}` : ''}
            </Text>
          </View>
          <ChevronRight size={18} color={Colors.muted} />
        </View>
      </Pressable>
      <View className="mt-3">
        <SurveyExportButtons
          survey={survey}
          client={client}
          project={project}
          technician={technician}
          pdfLabel="Descargar informe PDF"
          excelLabel="Descargar Excel"
        />
      </View>
    </View>
  );
}

function MemberBlock({
  row,
  expanded,
  onToggle,
  isSelf,
  projectsById,
  clientsById,
}: {
  row: MemberRow;
  expanded: boolean;
  onToggle: () => void;
  isSelf: boolean;
  projectsById: Map<string, Project>;
  clientsById: Map<string, Client>;
}) {
  const count = row.surveys.length;
  const summary =
    count === 0
      ? isSelf
        ? 'Aún no tienes levantamientos finalizados.'
        : 'No tiene levantamientos para compartir.'
      : `${count} ${count === 1 ? 'levantamiento' : 'levantamientos'} para descargar`;

  return (
    <Card>
      <Pressable onPress={onToggle} className="min-h-[56px] flex-row items-center gap-3">
        <ProfileAvatar name={row.member.name} photoPath={row.member.photoPath} size={48} />
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-base font-semibold text-ink">{row.member.name}</Text>
            {isSelf ? (
              <Text className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-bold uppercase text-brand">Tú</Text>
            ) : null}
          </View>
          <Text className="mt-0.5 text-sm text-muted">{summary}</Text>
        </View>
        {expanded ? (
          <ChevronDown size={18} color={Colors.muted} />
        ) : (
          <ChevronRight size={18} color={Colors.muted} />
        )}
      </Pressable>
      {expanded ? (
        <View className="mt-4 gap-3 border-t border-line pt-4">
          {count === 0 ? (
            <Text className="text-sm leading-5 text-muted">
              {isSelf
                ? 'Cuando finalices un levantamiento, aparecerá aquí junto al del resto del equipo.'
                : 'Cuando este técnico finalice un levantamiento, aparecerá aquí.'}
            </Text>
          ) : (
            row.surveys.map((survey) => {
              const project = projectsById.get(survey.projectId);
              const client = project ? clientsById.get(project.clientId) : undefined;
              return (
                <TeamSurveyRow
                  key={survey.id}
                  survey={survey}
                  project={project}
                  client={client}
                  technician={row.member.name}
                />
              );
            })
          )}
        </View>
      ) : null}
    </Card>
  );
}

export default function TeamScreen() {
  const { session } = useAuth();
  const { clients: localClients, projects: localProjects, surveys: localSurveys } = useAppData();
  const { refreshWorkspace } = useAppActions();
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query);
  const [remoteMembers, setRemoteMembers] = useState<TeamMember[]>([]);
  const [remoteSurveys, setRemoteSurveys] = useState<Survey[]>([]);
  const [remoteClients, setRemoteClients] = useState<Client[]>([]);
  const [remoteProjects, setRemoteProjects] = useState<Project[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(session?.id ?? null);

  const surveys = useMemo(
    () => mergeByUpdatedAt(remoteSurveys, localSurveys.filter((survey) => survey.status === 'completed')),
    [localSurveys, remoteSurveys],
  );
  const members = useMemo(
    () => assembleMembers(remoteMembers, session, surveys),
    [remoteMembers, session, surveys],
  );
  const projectsById = useMemo(
    () => indexById(mergeByUpdatedAt(remoteProjects, localProjects)),
    [localProjects, remoteProjects],
  );
  const clientsById = useMemo(
    () => indexById(mergeByUpdatedAt(remoteClients, localClients)),
    [localClients, remoteClients],
  );

  const load = useCallback(async () => {
    setRefreshing(true);
    setError('');

    const results = await Promise.allSettled([listTeamMembers(), listCompletedSurveys()]);
    const [membersResult, surveysResult] = results;
    const nextSurveys = surveysResult.status === 'fulfilled' ? surveysResult.value : [];
    if (membersResult.status === 'fulfilled') setRemoteMembers(membersResult.value);
    if (surveysResult.status === 'fulfilled') setRemoteSurveys(nextSurveys);
    else setRemoteSurveys([]);

    if (nextSurveys.length > 0) {
      try {
        const catalog = await loadCatalogForSurveys(nextSurveys);
        setRemoteClients(catalog.clients);
        setRemoteProjects(catalog.projects);
      } catch {
        setRemoteClients([]);
        setRemoteProjects([]);
      }
    } else {
      setRemoteClients([]);
      setRemoteProjects([]);
    }

    const firstError = results.find((result) => result.status === 'rejected') as PromiseRejectedResult | undefined;
    if (firstError && (surveysResult.status === 'rejected' || membersResult.status === 'rejected')) {
      const caught = firstError.reason;
      setError(
        isOfflineError(caught)
          ? 'Sin conexión. El entorno del equipo se carga con internet.'
          : caught instanceof Error
            ? caught.message
            : 'No se pudo cargar el equipo.',
      );
    }

    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (session?.id) setOpenId((current) => current ?? session.id);
  }, [session?.id]);

  const rows = useMemo(() => {
    const grouped = new Map<string, Survey[]>();
    for (const survey of completedSurveys(surveys)) {
      const list = grouped.get(survey.userId) ?? [];
      list.push(survey);
      grouped.set(survey.userId, list);
    }

    const term = search.trim().toLowerCase();
    return members
      .map((member) => ({
        member,
        surveys: (grouped.get(member.id) ?? []).sort((a, b) =>
          (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt),
        ),
      }))
      .filter((row) => {
        if (!term) return true;
        if (row.member.name.toLowerCase().includes(term) || row.member.email.toLowerCase().includes(term)) {
          return true;
        }
        return row.surveys.some((survey) => {
          const project = projectsById.get(survey.projectId);
          const client = project ? clientsById.get(project.clientId) : undefined;
          return [survey.code, project?.name, client?.name].filter(Boolean).some((value) =>
            value!.toLowerCase().includes(term),
          );
        });
      })
      .sort((a, b) => {
        if (a.member.id === session?.id) return -1;
        if (b.member.id === session?.id) return 1;
        return a.member.name.localeCompare(b.member.name, 'es');
      });
  }, [clientsById, members, projectsById, search, session?.id, surveys]);

  async function refresh() {
    await refreshWorkspace();
    await load();
  }

  return (
    <Screen scroll={false} padded={false}>
      <CatalogList
        data={rows}
        extraData={`${openId}:${search}:${refreshing}:${session?.id}:${surveys.length}`}
        keyExtractor={(row) => row.member.id}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        header={
          <>
            <TabBrandHeader
              title="Equipo VICAST"
              subtitle="Tus levantamientos finalizados y los del equipo listos para descargar"
            />
            {error ? <Text className="text-sm leading-5 text-danger">{error}</Text> : null}
            <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar técnico, cliente o código" />
          </>
        }
        empty={
          error ? (
            <EmptyState title="No se pudo cargar el equipo" description={error} />
          ) : (
            <EmptyState
              title="Aún no hay técnicos"
              description="Cuando existan cuentas en VICAST, aparecerán aquí con sus levantamientos."
            />
          )
        }
        renderItem={(row) => (
          <MemberBlock
            row={row}
            expanded={openId === row.member.id}
            onToggle={() => setOpenId((current) => (current === row.member.id ? null : row.member.id))}
            isSelf={row.member.id === session?.id}
            projectsById={projectsById}
            clientsById={clientsById}
          />
        )}
      />
    </Screen>
  );
}
