import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';

import { InAppNotification } from '@/components/InAppNotification';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNotifications } from '@/hooks/useNotifications';
import {
  startMessageNotificationListener,
  stopMessageNotificationListener,
} from '@/services/messageNotificationService';
import {
  setUserAway,
  setUserOnline,
  startPresenceTracking,
  stopPresenceTracking,
  updatePresence
} from '@/services/presenceService';
import { selectAuthLoading, selectUser, useAuthStore } from '@/stores/authStore';
import { selectCurrentConversationId, useChatStore } from '@/stores/chatStore';

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
  const processedNotificationIdsRef = useRef<Set<string>>(new Set());
  
  // In-app notification state
  const { notification } = useNotifications();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    title: string;
    message: string;
    conversationId: string;
  } | null>(null);

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

  // Handle in-app notifications
  const activeConversationId = useChatStore(selectCurrentConversationId);
  useEffect(() => {
    if (!notification) return;

    // Prevent reprocessing the same notification
    const id = notification.request.identifier;
    if (processedNotificationIdsRef.current.has(id)) {
      return;
    }

    const data = notification.request.content.data;
    const conversationId = data?.conversationId as string | undefined;
    if (!conversationId) {
      processedNotificationIdsRef.current.add(id);
      return;
    }

    // Don't show if user is already in this conversation
    if (activeConversationId && activeConversationId === conversationId) {
      processedNotificationIdsRef.current.add(id);
      // Dismiss the system notification so it doesn't linger
      import('expo-notifications').then(({ dismissNotificationAsync }) => {
        dismissNotificationAsync(id);
      });
      return;
    }

    // Show in-app notification
    const title = notification.request.content.title || 'New Message';
    const message = notification.request.content.body || '';

    setNotificationData({ title, message, conversationId });
    setShowNotification(true);

    // Mark as processed and dismiss system notification
    processedNotificationIdsRef.current.add(id);
    import('expo-notifications').then(({ dismissNotificationAsync }) => {
      dismissNotificationAsync(id);
    });
  }, [notification, activeConversationId]);

  // Handle presence tracking and message notifications based on app lifecycle
  useEffect(() => {
    if (!user) return;

    // Start presence tracking when user logs in
    startPresenceTracking(user.id, user.appearOffline || false).catch((error) => {
      console.error('Failed to start presence tracking:', error);
    });

    // Start listening for new messages (for in-app notifications in Expo Go)
    // In production builds with FCM, this provides a fallback
    startMessageNotificationListener();

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
      stopMessageNotificationListener();
    };
  }, [user]);

  // Handle notification navigation
  const handleNotificationPress = () => {
    if (notificationData?.conversationId) {
      // Clear immediately to avoid reappearance
      setShowNotification(false);
      setNotificationData(null);
      router.push(`/chat/${notificationData.conversationId}`);
    }
  };

  const handleNotificationDismiss = () => {
    // Clear immediately to avoid reappearance
    setShowNotification(false);
    setNotificationData(null);
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" options={{ headerShown: true, title: 'Chat' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Settings' }} />
      </Stack>
      <StatusBar style="auto" />
      
      {/* In-app notification banner */}
      {notificationData && (
        <InAppNotification
          visible={showNotification}
          title={notificationData.title}
          message={notificationData.message}
          conversationId={notificationData.conversationId}
          onPress={handleNotificationPress}
          onDismiss={handleNotificationDismiss}
        />
      )}
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
