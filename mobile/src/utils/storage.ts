import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const USER_PHONE_KEY = 'user_phone';

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function savePhone(phone: string): Promise<void> {
  await SecureStore.setItemAsync(USER_PHONE_KEY, phone);
}

export async function getPhone(): Promise<string | null> {
  return SecureStore.getItemAsync(USER_PHONE_KEY);
}

export async function clearAuth(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_PHONE_KEY);
}
