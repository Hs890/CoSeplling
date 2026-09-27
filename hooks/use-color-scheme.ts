import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { getSetting, setSetting } from '@/db/queries/settings';

export type ThemePreference = 'dark' | 'light' | 'system';

type Listener = (mode: ThemePreference) => void;
const listeners = new Set<Listener>();

let currentPreference: ThemePreference = 'dark';
let isInitialized = false;

function notify() {
  listeners.forEach((l) => l(currentPreference));
}

export async function initThemePreference() {
  if (isInitialized) return;
  try {
    const saved = await getSetting('themePreference');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      currentPreference = saved;
      notify();
    }
  } catch {
    // default dark
  } finally {
    isInitialized = true;
  }
}

export async function setThemePreference(mode: ThemePreference) {
  currentPreference = mode;
  notify();
  await setSetting('themePreference', mode).catch(() => {});
}

export function useThemePreference(): [ThemePreference, (mode: ThemePreference) => void] {
  const [pref, setPref] = useState<ThemePreference>(currentPreference);

  useEffect(() => {
    initThemePreference();
    const handler: Listener = (newMode) => setPref(newMode);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  return [pref, setThemePreference];
}

/** Normalised to 'light' | 'dark' */
export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme() === 'dark' ? 'dark' : 'light';
  const [pref, setPref] = useState<ThemePreference>(currentPreference);

  useEffect(() => {
    initThemePreference();
    const handler: Listener = (newMode) => setPref(newMode);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (pref === 'system') {
    return systemScheme;
  }
  return pref;
}
