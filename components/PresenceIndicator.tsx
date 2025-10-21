// Visual presence indicator component
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useUserPresence } from '../hooks/usePresence';
import { User, UserPresence } from '../types';

interface PresenceIndicatorProps {
  userId?: string;
  user?: User; // Optional user object to check appearOffline
  size?: 'small' | 'medium' | 'large';
  showStatus?: boolean; // Show custom status text
  style?: ViewStyle;
}

export default function PresenceIndicator({
  userId,
  user,
  size = 'small',
  showStatus = false,
  style,
}: PresenceIndicatorProps) {
  const { presence } = useUserPresence(userId);

  // If user has appearOffline set, always show offline
  const effectiveStatus = user?.appearOffline ? 'offline' : presence?.status || 'offline';

  const dotSize = size === 'small' ? 10 : size === 'medium' ? 14 : 18;
  const dotColor = getStatusColor(effectiveStatus);

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.dot, { width: dotSize, height: dotSize, backgroundColor: dotColor }]} />
      {showStatus && presence?.customStatus && (
        <Text style={styles.statusText} numberOfLines={1}>
          {presence.customStatus}
        </Text>
      )}
    </View>
  );
}

function getStatusColor(status: UserPresence['status']): string {
  switch (status) {
    case 'online':
      return '#34C759'; // Green
    case 'away':
      return '#FF9500'; // Orange
    case 'offline':
    default:
      return '#8E8E93'; // Gray
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
  },
});

/**
 * Avatar wrapper component with presence indicator
 */
interface AvatarWithPresenceProps {
  user: User;
  size?: number;
  showPresence?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function AvatarWithPresence({
  user,
  size = 40,
  showPresence = true,
  children,
  style,
}: AvatarWithPresenceProps) {
  return (
    <View style={[avatarStyles.avatarContainer, style]}>
      {children}
      {showPresence && (
        <View style={[avatarStyles.presenceBadge, { width: size * 0.3, height: size * 0.3 }]}>
          <PresenceIndicator userId={user.id} user={user} size="small" />
        </View>
      )}
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
  },
  presenceBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

