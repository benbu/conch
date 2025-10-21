import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  setUserAway,
  setUserOnline,
  startPresenceTracking,
  stopPresenceTracking,
  updatePresence
} from '@/services/presenceService';
import { selectAuthLoading, selectUser, useAuthStore } from '@/stores/authStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const colorScheme = useColorScheme();
  const user = useAuthStore(selectUser);
  const loading = useAuthStore(selectAuthLoading);
  const { initialized } = useAuthContext();
  const segments = useSegments();
  const router = useRouter();
  const awayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!initialized || loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)');
    }
  }, [user, initialized, loading, segments]);

  // Handle presence tracking based on app lifecycle
  useEffect(() => {
    if (!user) return;

    // Start presence tracking when user logs in
    startPresenceTracking(user.id, user.appearOffline || false).catch((error) => {
      console.error('Failed to start presence tracking:', error);
    });

    // Handle app state changes
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (!user) return;

      // Clear any existing away timer
      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
        awayTimerRef.current = null;
      }

      // App is coming to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (!user.appearOffline) {
          await setUserOnline(user.id).catch(console.error);
        }
      }

      // App is going to background
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        if (!user.appearOffline) {
          // Set offline immediately when app goes to background
          await updatePresence(user.id, 'offline').catch(console.error);
        }
      }

      // App is active - set up away timer after 5 minutes
      if (nextAppState === 'active' && !user.appearOffline) {
        awayTimerRef.current = setTimeout(() => {
          if (!user.appearOffline) {
            setUserAway(user.id).catch(console.error);
          }
        }, 5 * 60 * 1000); // 5 minutes
      }

      appState.current = nextAppState;
    });

    // Cleanup on unmount or user logout
    return () => {
      subscription.remove();
      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
      }
      stopPresenceTracking(user.id).catch(console.error);
    };
  }, [user]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: 'Chat' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Settings' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
