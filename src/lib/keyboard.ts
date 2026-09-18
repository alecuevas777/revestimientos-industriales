import { Platform } from 'react-native';

export const keyboardAvoidingBehavior = Platform.OS === 'ios' ? ('padding' as const) : undefined;
