import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { LogBox, ActivityIndicator, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeDb } from '@/db/client';

LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await initializeDb();
        setDbReady(true);
      } catch (error) {
        console.error('DB init failed:', error);
        setDbReady(true); // Continue anyway
      }
    })();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
