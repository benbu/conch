import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { InAppNotification } from '@/components/InAppNotification';
import { IN_APP_NOTIFICATIONS_ENABLED, LOCAL_NOTIFICATIONS_IN_EXPO_GO } from '@/constants/featureFlags';
import { GLASS_INTENSITY, getGlassTint } from '@/constants/theme';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNotifications } from '@/hooks/useNotifications';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import {
  startMessageNotificationListener,
  stopMessageNotificationListener,
} from '@/services/messageNotificationService';
import {
  setUserOnline,
  startPresenceTracking,
  stopPresenceTracking
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
    if (!IN_APP_NOTIFICATIONS_ENABLED) return;
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

    // Send a one-time heartbeat on login
    if (!user.appearOffline) {
      setUserOnline(user.id).catch(() => {});
    }

    // Start listening for new messages (for in-app notifications in Expo Go)
    // In production builds with FCM, this provides a fallback
    if (IN_APP_NOTIFICATIONS_ENABLED || LOCAL_NOTIFICATIONS_IN_EXPO_GO) {
      startMessageNotificationListener();
    }

    // Minimal app state change handler just to keep reference; presence handled in usePresenceHeartbeat
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      appState.current = nextAppState;
    });

    // Cleanup on unmount or user logout
    return () => {
      subscription.remove();
      if (awayTimerRef.current) {
        clearTimeout(awayTimerRef.current);
      }
      stopPresenceTracking(user.id).catch(console.error);
      if (IN_APP_NOTIFICATIONS_ENABLED || LOCAL_NOTIFICATIONS_IN_EXPO_GO) {
        stopMessageNotificationListener();
      }
    };
  }, [user]);

  // Centralized activity-gated heartbeat
  usePresenceHeartbeat(user?.id, user?.appearOffline);

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
      <LinearGradient
        colors={[ 'rgb(100, 38, 201)', 'rgb(170, 228, 238)' ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <Stack
          screenOptions={{
            animation: 'fade',
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="chat/[id]"
            options={{
              headerShown: true,
              headerTransparent: true,
              headerBackground: () => (
                <BlurView
                  tint={getGlassTint(colorScheme === 'dark')}
                  intensity={GLASS_INTENSITY}
                  style={StyleSheet.absoluteFill}
                />
              ),
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
        
        {/* In-app notification banner (feature-flagged) */}
        {IN_APP_NOTIFICATIONS_ENABLED && notificationData && (
          <InAppNotification
            visible={showNotification}
            title={notificationData.title}
            message={notificationData.message}
            conversationId={notificationData.conversationId}
            onPress={handleNotificationPress}
            onDismiss={handleNotificationDismiss}
          />
        )}
      </LinearGradient>
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
