import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSetting, setSetting } from '../db/queries/settings';

const SECURE_KEY = 'openrouter_api_key';
const FALLBACK_KEY = 'openrouter_key_fallback';

export async function saveApiKey(key: string): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(SECURE_KEY, key);
    } else {
      // Fallback to settings table for web (not ideal, but necessary)
      await setSetting(FALLBACK_KEY, key);
    }
  } catch (error) {
    console.warn('Failed to save in secure store, using settings table:', error);
    await setSetting(FALLBACK_KEY, key);
  }
}

export async function getApiKey(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      const key = await SecureStore.getItemAsync(SECURE_KEY);
      if (key) return key;
    }
  } catch (error) {
    console.warn('Failed to read from secure store:', error);
  }

  // Fallback to settings
  return await getSetting(FALLBACK_KEY);
}

export async function deleteApiKey(): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(SECURE_KEY);
    }
  } catch (error) {
    console.warn('Failed to delete from secure store:', error);
  }

  await (await import('../db/queries/settings')).deleteSetting(FALLBACK_KEY);
}

export async function testApiKey(key: string): Promise<boolean> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    return response.ok;
  } catch (error) {
    console.error('API key test failed:', error);
    return false;
  }
}
