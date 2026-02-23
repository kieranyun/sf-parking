import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ParkingProvider } from '@/contexts/ParkingContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNotifications } from '@/hooks/useNotifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Inner layout that has access to ParkingContext.
 * useNotifications needs ParkingContext to update parked state from push data.
 */
function InnerLayout() {
  const colorScheme = useColorScheme();
  useNotifications();

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

export default function RootLayout() {
  return (
    <ParkingProvider>
      <InnerLayout />
    </ParkingProvider>
  );
}
