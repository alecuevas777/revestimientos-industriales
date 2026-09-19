import { Text, View } from 'react-native';

import { Input } from '@/components/ui/Input';
import type { ClientDraft, ProjectDraft } from '@/types';

export type ReportClientFields = Pick<ClientDraft, 'rut' | 'contactName' | 'phone' | 'email' | 'address' | 'city'>;
export type ReportProjectFields = Pick<ProjectDraft, 'address' | 'city' | 'siteContactName' | 'siteContactPhone'>;

type Props = {
  client: ReportClientFields;
  project: ReportProjectFields;
  onChangeClient: (patch: Partial<ReportClientFields>) => void;
  onChangeProject: (patch: Partial<ReportProjectFields>) => void;
};

export function ClientProjectReportFields({ client, project, onChangeClient, onChangeProject }: Props) {
  return (
    <View className="gap-5">
      <View className="gap-4">
        <Text className="text-base font-semibold text-ink">Datos del cliente para el informe</Text>
        <Text className="text-sm leading-5 text-muted">
          No son obligatorios para empezar, pero salen en el PDF. Conviene completarlos ahora.
        </Text>
        <Input
          label="RUT"
          value={client.rut ?? ''}
          onChangeText={(rut) => onChangeClient({ rut })}
          placeholder="76.452.110-K"
        />
        <Input
          label="Persona de contacto"
          hint="Nombre de la persona en la empresa."
          value={client.contactName ?? ''}
          onChangeText={(contactName) => onChangeClient({ contactName })}
          placeholder="María Soto"
        />
        <Input
          label="Teléfono"
          value={client.phone ?? ''}
          onChangeText={(phone) => onChangeClient({ phone })}
          keyboardType="phone-pad"
          placeholder="+56 9 0000 0000"
        />
        <Input
          label="Email"
          value={client.email ?? ''}
          onChangeText={(email) => onChangeClient({ email })}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="contacto@empresa.cl"
        />
      </View>

      <View className="gap-4">
        <Text className="text-base font-semibold text-ink">Datos del recinto para el informe</Text>
        <Input
          label="Dirección"
          value={project.address ?? ''}
          onChangeText={(address) => onChangeProject({ address })}
          placeholder="Camino a Coronel 2450"
        />
        <Input
          label="Comuna / ciudad"
          value={project.city ?? ''}
          onChangeText={(city) => onChangeProject({ city })}
          placeholder="Coronel"
        />
        <Input
          label="Contacto en terreno"
          hint="Quien recibe en planta. Puede ser distinto al contacto de la empresa."
          value={project.siteContactName ?? ''}
          onChangeText={(siteContactName) => onChangeProject({ siteContactName })}
          placeholder="Luis Rivas"
        />
        <Input
          label="Teléfono en terreno"
          value={project.siteContactPhone ?? ''}
          onChangeText={(siteContactPhone) => onChangeProject({ siteContactPhone })}
          keyboardType="phone-pad"
          placeholder="+56 9 0000 0000"
        />
      </View>
    </View>
  );
}
