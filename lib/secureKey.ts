import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { getSetting, setSetting, deleteSetting } from '../db/queries/settings';

export type AiProvider = 'gemini' | 'openrouter';

const KEY_NAMES = {
  gemini: { secure: 'gemini_api_key', fallback: 'gemini_key_fallback' },
  openrouter: { secure: 'openrouter_api_key', fallback: 'openrouter_key_fallback' },
};

export function detectProvider(key: string): AiProvider {
  const trimmed = key.trim();
  // Google AI Studio keys: old format starts "AIza", newer format starts "AQ."
  if (trimmed.startsWith('AIza') || trimmed.startsWith('AQ.')) {
    return 'gemini';
  }
  // OpenRouter keys: sk-or-... etc.
  return 'openrouter';
}

export async function getActiveProvider(): Promise<AiProvider> {
  const p = await getSetting('ai_provider');
  if (p === 'openrouter' || p === 'gemini') return p;
  // Default to Gemini as it is 100% free from AI Studio
  return 'gemini';
}

export async function setActiveProvider(provider: AiProvider): Promise<void> {
  await setSetting('ai_provider', provider);
}

export async function saveApiKey(key: string, provider?: AiProvider): Promise<void> {
  const trimmed = key.trim();
  const prov = provider || detectProvider(trimmed);
  const names = KEY_NAMES[prov];

  await setActiveProvider(prov);

  try {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(names.secure, trimmed);
    } else {
      await setSetting(names.fallback, trimmed);
    }
  } catch (error) {
    console.warn('Failed to save in secure store, falling back to settings table:', error);
    await setSetting(names.fallback, trimmed);
  }
}

export async function getApiKey(provider?: AiProvider): Promise<string | null> {
  const prov = provider || (await getActiveProvider());
  const names = KEY_NAMES[prov];

  try {
    if (Platform.OS !== 'web') {
      const key = await SecureStore.getItemAsync(names.secure);
      if (key && key.trim().length > 0) return key.trim();
    }
  } catch (error) {
    console.warn('Failed to read from secure store:', error);
  }

  const fallback = await getSetting(names.fallback);
  if (fallback && fallback.trim().length > 0) return fallback.trim();

  // Legacy fallback for previous openrouter_api_key
  if (prov === 'openrouter') {
    const legacy = await getSetting('openrouter_key_fallback');
    if (legacy) return legacy.trim();
  }

  return null;
}

export async function deleteApiKey(provider?: AiProvider): Promise<void> {
  const prov = provider || (await getActiveProvider());
  const names = KEY_NAMES[prov];

  try {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(names.secure);
    }
  } catch (error) {
    console.warn('Failed to delete from secure store:', error);
  }

  await deleteSetting(names.fallback);
}
