import Avatar from '@/components/Avatar';
import { Text, TouchableOpacity, View } from 'react-native';
import OverlappingAvatars from '../OverlappingAvatars';
import { AvatarWithPresence } from '../PresenceIndicator';

export function ChatHeaderAvatars({
  type,
  participants,
  otherUser,
  onPressGroup,
  conversationTitle,
}: any) {
  if (type === 'group') {
    return (
      <TouchableOpacity
        onPress={onPressGroup}
        activeOpacity={onPressGroup ? 0.7 : 1}
        style={{ flexDirection: 'row', alignItems: 'center' }}
      >
        <OverlappingAvatars members={participants} maxVisible={3} size="small" />
        <Text style={{ marginLeft: 8, color: '#000', fontWeight: '600', fontSize: 18 }} numberOfLines={1}>
          ({participants?.length || 0})
        </Text>
        {conversationTitle ? (
          <Text
            style={{ marginLeft: 8, color: '#000', fontWeight: '600', fontSize: 18 }}
            numberOfLines={1}
          >
            {conversationTitle}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  }
  if (otherUser) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AvatarWithPresence user={otherUser} size={40}>
          <Avatar user={otherUser} size={40} />
        </AvatarWithPresence>
        <Text style={{ marginLeft: 10, color: '#000', fontWeight: '600', fontSize: 18 }} numberOfLines={1}>
          {otherUser.displayName || 'Chat'}
        </Text>
      </View>
    );
  }
  return null;
}


