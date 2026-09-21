import { Redirect } from 'expo-router';

import { href } from '@/lib/nav';

export default function RegisterScreen() {
  return <Redirect href={href('/login')} />;
}
