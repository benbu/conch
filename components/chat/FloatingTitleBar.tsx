import { Text, TouchableOpacity, View } from 'react-native';
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
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0, 0, 0, 0.05)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 3,
        }}
        onPress={() => {
          if (currentUserRole === 'admin') onEditGroup?.();
        }}
        activeOpacity={currentUserRole === 'admin' ? 0.7 : 1}
      >
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>
          {conversation.name || conversation.title || 'Group Chat'}
        </Text>
        <Text style={{ fontSize: 13, color: '#666', marginTop: 2 }}>
          {participantsCount} member{participantsCount !== 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>
    );
  }

  if (otherUser) {
    const effectiveStatus = otherUser?.appearOffline ? 'offline' : presence?.status || 'offline';
    return (
      <View style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
      }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#000' }}>
          {otherUser.displayName || 'Chat'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <PresenceIndicator userId={otherUser.id} user={otherUser} size="small" />
          <Text style={{ fontSize: 13, color: '#666', marginLeft: 4 }}>
            {effectiveStatus === 'online' ? 'Online' : effectiveStatus === 'away' ? 'Away' : 'Offline'}
          </Text>
          {presence?.customStatus && (
            <Text style={{ fontSize: 13, color: '#999' }}> • {presence.customStatus}</Text>
          )}
        </View>
      </View>
    );
  }

  return null;
}


