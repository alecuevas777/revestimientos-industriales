import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useApp } from '@/context/AppProvider';
import { replace } from '@/lib/nav';

export default function ProfileScreen() {
  const { session, logout, resetDemoData } = useApp();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <Screen>
      <ScreenHeader title="Perfil" />
      <Card>
        <Text className="text-xl font-bold text-ink">{session?.name ?? 'Técnico Demo'}</Text>
        <Text className="mt-1 text-sm text-muted">{session?.email}</Text>
        <View className="mt-5 gap-3">
          <Text className="text-xs font-semibold uppercase tracking-wide text-muted">Aplicación</Text>
          <Text className="text-base text-ink">Aplicación de levantamientos</Text>
          <Text className="text-sm text-muted">Modo: Demo local</Text>
          <Text className="text-sm leading-5 text-muted">
            Los datos de esta versión se almacenan únicamente en este dispositivo.
          </Text>
        </View>
      </Card>

      <View className="mt-6 gap-3">
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
        message="Podrás volver a entrar con el usuario demo. Los datos del dispositivo se mantienen."
        confirmLabel="Cerrar sesión"
        destructive
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          await logout();
          replace('/login');
        }}
      />
    </Screen>
  );
}
