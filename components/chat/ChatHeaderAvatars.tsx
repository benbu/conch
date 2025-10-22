import Avatar from '@/components/Avatar';
import { View } from 'react-native';
import OverlappingAvatars from '../OverlappingAvatars';

export function ChatHeaderAvatars({
  type,
  participants,
  otherUser,
  onPressGroup,
}: any) {
  if (type === 'group') {
    return (
      <OverlappingAvatars
        members={participants}
        maxVisible={3}
        size="small"
        onPress={onPressGroup}
      />
    );
  }
  if (otherUser) {
    return (
      <View style={{ alignItems: 'center' }}>
        <Avatar user={otherUser} size={36} />
      </View>
    );
  }
  return null;
}


