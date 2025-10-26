import * as SecureStore from 'expo-secure-store';

const KEY = 'auth_email_password';

export async function saveCreds(email: string, password: string): Promise<void> {
  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    console.warn('SecureStore is not available; cannot save credentials');
    return;
  }
  await SecureStore.setItemAsync(
    KEY,
    JSON.stringify({ email, password }),
    {
      keychainService: 'conch.auth',
      requireAuthentication: false,
    }
  );
  console.log('SecureStore: credentials saved');
}

export async function getCreds(): Promise<{ email: string; password: string } | null> {
  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    console.warn('SecureStore is not available; cannot load credentials');
    return null;
  }
  const value = await SecureStore.getItemAsync(KEY, {
    keychainService: 'conch.auth',
    requireAuthentication: false,
  });
  if (value) {
    console.log('SecureStore: credentials retrieved');
  } else {
    console.log('SecureStore: no credentials stored');
  }
  return value ? JSON.parse(value) : null;
}

export async function clearCreds(): Promise<void> {
  const available = await SecureStore.isAvailableAsync();
  if (!available) {
    console.warn('SecureStore is not available; cannot clear credentials');
    return;
  }
  await SecureStore.deleteItemAsync(KEY, {
    keychainService: 'conch.auth',
  });
  console.log('SecureStore: credentials cleared');
}


