import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, GLASS_INTENSITY, getGlassTint } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <Tabs
      detachInactiveScreens
      screenOptions={{
        freezeOnBlur: true,
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        sceneStyle: { backgroundColor: 'white' },
        headerBackground: () => (
          <BlurView
            tint={getGlassTint(colorScheme === 'dark')}
            intensity={GLASS_INTENSITY}
            style={[StyleSheet.absoluteFill, { borderBottomWidth: 1, borderBottomColor: '#ddd', alignItems: 'center' }]}
          />
        ),
        headerStyle: {
          borderBottomWidth: 5,
          borderBottomColor: '#999'
        },
        tabBarBackground: () => (
          <BlurView
            tint={getGlassTint(colorScheme === 'dark')}
            intensity={GLASS_INTENSITY}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 1,
          position: 'absolute',
          elevation: 0,
        },
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
          tabBarAccessibilityLabel: 'tab-home',
        }}
      />
      <Tabs.Screen
        name="new"
        options={{
          title: 'New',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.message" color={color} />,
          tabBarAccessibilityLabel: 'tab-new',
          // When pressing the New tab, immediately open the group creation flow
          tabBarButton: (props) => (
            <HapticTab
              {...props}
              onPress={() => {
                // Route to Explore with a flag that triggers multi-select/group flow
                router.push('/(tabs)/explore?startGroup=1');
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          tabBarAccessibilityLabel: 'tab-profile',
        }}
      />
      {/* Keep Explore screen available but hidden from the tab bar */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
          title: 'New Chat',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="ai-settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="presence-settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="developer"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
