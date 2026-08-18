import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { LogBox } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { requestPermissions } from '@/utils/notifications';

// Expo Go SDK 53+ remote push warning ko ignore karein (Local alarms are fully supported)
LogBox.ignoreLogs([
  'Android Push notifications (remote notifications)',
  '`expo-notifications` functionality is not fully supported',
]);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // App open hone par notification permission maango
  useEffect(() => {
    requestPermissions();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
