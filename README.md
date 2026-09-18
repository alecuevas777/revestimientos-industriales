# VICAST · Levantamientos

App móvil de VICAST para levantamientos técnicos de superficies. Expo, TypeScript, NativeWind y Supabase (Auth, Postgres y Storage).

## Arranque

```bash
npm install
npx expo start --clear
```

## Flujo

Login → Dashboard → Clientes → Proyecto → Nuevo levantamiento → Historial → Ficha técnica

Los clientes, proyectos, levantamientos y fotos se sincronizan con la cuenta. Sin conexión, quedan en el dispositivo y se suben después. El schema está en `supabase/schema.sql`.
