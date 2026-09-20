import { useState } from 'react';
import { Text, View } from 'react-native';

import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAppActions } from '@/context/AppProvider';
import { useAuth } from '@/context/AuthProvider';
import { useActionLock } from '@/hooks/useActionLock';
import { chooseProfilePhoto } from '@/lib/pickPhoto';
import { replace } from '@/lib/nav';
import { phoneError } from '@/lib/validate';

export default function EditProfileScreen() {
  const { session, updateProfile } = useAuth();
  const { showToast } = useAppActions();
  const run = useActionLock();
  const [name, setName] = useState(session?.name ?? '');
  const [phone, setPhone] = useState(session?.phone ?? '');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [removePhoto, setRemovePhoto] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  if (!session) return null;

  const previewUri = removePhoto ? undefined : photoUri;
  const photoPath = removePhoto ? undefined : session.photoPath;

  async function handleSave() {
    const nextErrors = {
      name: name.trim() ? undefined : 'Ingresa tu nombre.',
      phone: phoneError(phone),
    };
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.phone) return;

    await run(async () => {
      setSaving(true);
      try {
        const message = await updateProfile({
          name,
          phone,
          photoUri: removePhoto ? undefined : photoUri,
          removePhoto,
        });
        if (message) {
          showToast(message);
          return;
        }
        showToast('Perfil actualizado');
        replace('/perfil');
      } finally {
        setSaving(false);
      }
    });
  }

  return (
    <Screen>
      <ScreenHeader title="Editar perfil" subtitle="Estos datos quedan en tu cuenta" />
      <View className="items-center gap-3 py-2">
        <ProfileAvatar name={name || session.name} photoPath={photoPath} previewUri={previewUri} size={96} />
        <Button
          label="Cambiar foto"
          variant="secondary"
          onPress={() =>
            chooseProfilePhoto((uri) => {
              setPhotoUri(uri);
              setRemovePhoto(false);
            })
          }
        />
        {photoPath || photoUri ? (
          <Button
            label="Quitar foto"
            variant="ghost"
            onPress={() => {
              setPhotoUri(undefined);
              setRemovePhoto(true);
            }}
          />
        ) : null}
        <Text className="text-center text-sm text-muted">El correo no se cambia desde aquí.</Text>
      </View>

      <View className="mt-6 gap-4">
        <Input
          label="Nombre"
          value={name}
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          error={errors.name}
          autoCapitalize="words"
          placeholder="Nombre y apellido"
        />
        <Input
          label="Teléfono"
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            setErrors((current) => ({ ...current, phone: undefined }));
          }}
          error={errors.phone}
          keyboardType="phone-pad"
          placeholder="+56 9 0000 0000"
        />
        <Input label="Email" value={session.email} editable={false} />
        <Button label="Guardar cambios" loading={saving} onPress={() => void handleSave()} />
      </View>
    </Screen>
  );
}
