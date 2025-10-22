import { Text, View } from 'react-native';
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
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#34C759', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            {otherUser.displayName?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
      </View>
    );
  }
  return null;
}


