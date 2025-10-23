import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PresenceIndicator from '../PresenceIndicator';

export function FloatingTitleBar({
  type,
  conversation,
  participantsCount,
  currentUserRole,
  onEditGroup,
  otherUser,
  presence,
}: any) {
  if (type === 'group') {
    return (
      <TouchableOpacity
        style={{ overflow: 'hidden' }}
        onPress={() => {
          if (currentUserRole === 'admin') onEditGroup?.();
        }}
        activeOpacity={currentUserRole === 'admin' ? 0.7 : 1}
      >
        <View style={styles.glassContainer}>
          <View style={styles.glassInner}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>
              {conversation.name || conversation.title || 'Group Chat'}
            </Text>
            <Text style={{ fontSize: 13, color: '#fff', marginTop: 2 }}>
              {participantsCount} member{participantsCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (otherUser) {
    const effectiveStatus = otherUser?.appearOffline ? 'offline' : presence?.status || 'offline';
    return (
      <View style={styles.glassContainer}>
        <View style={styles.glassInner}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>
            {otherUser.displayName || 'Chat'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <PresenceIndicator userId={otherUser.id} user={otherUser} size="small" />
            <Text style={{ fontSize: 13, color: '#fff', marginLeft: 4 }}>
              {effectiveStatus === 'online' ? 'Online' : effectiveStatus === 'away' ? 'Away' : 'Offline'}
            </Text>
            {presence?.customStatus && (
              <Text style={{ fontSize: 13, color: '#fff' }}> • {presence.customStatus}</Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  glassContainer: {
    overflow: 'hidden',
  },
  glassInner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },
});


