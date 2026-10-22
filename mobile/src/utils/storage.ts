import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const USER_PHONE_KEY = 'user_phone';

// SecureStore is only supported on native platforms (iOS / Android)
async function getSecureStore() {
  if (Platform.OS !== 'web') {
    return import('expo-secure-store');
  }
  return null;
}

export async function saveToken(token: string): Promise<void> {
  try {
    const SecureStore = await getSecureStore();
    if (SecureStore) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      return;
    }
  } catch {
    // Fall back to AsyncStorage
  }
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  try {
    const SecureStore = await getSecureStore();
    if (SecureStore) {
      const val = await SecureStore.getItemAsync(TOKEN_KEY);
      if (val) return val;
    }
  } catch {
    // Fall back to AsyncStorage
  }
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken(): Promise<void> {
  try {
    const SecureStore = await getSecureStore();
    if (SecureStore) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function savePhone(phone: string): Promise<void> {
  try {
    const SecureStore = await getSecureStore();
    if (SecureStore) {
      await SecureStore.setItemAsync(USER_PHONE_KEY, phone);
      return;
    }
  } catch {
    // Fall back to AsyncStorage
  }
  await AsyncStorage.setItem(USER_PHONE_KEY, phone);
}

export async function getPhone(): Promise<string | null> {
  try {
    const SecureStore = await getSecureStore();
    if (SecureStore) {
      const val = await SecureStore.getItemAsync(USER_PHONE_KEY);
      if (val) return val;
    }
  } catch {
    // Fall back to AsyncStorage
  }
  return AsyncStorage.getItem(USER_PHONE_KEY);
}

export async function clearAuth(): Promise<void> {
  await removeToken();
  try {
    const SecureStore = await getSecureStore();
    if (SecureStore) {
      await SecureStore.deleteItemAsync(USER_PHONE_KEY);
    }
  } catch {
    // ignore
  }
  await AsyncStorage.removeItem(USER_PHONE_KEY);
}
