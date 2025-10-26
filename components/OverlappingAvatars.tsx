import { User } from '@/types';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from './Avatar';

interface OverlappingAvatarsProps {
  members: User[];
  maxVisible?: number;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
}

export default function OverlappingAvatars({
  members,
  maxVisible = 3,
  size = 'medium',
  onPress,
}: OverlappingAvatarsProps) {
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = Math.max(0, members.length - maxVisible);

  const sizeMap = {
    small: 38,
    medium: 40,
    large: 50,
  };

  const avatarSize = sizeMap[size];
  const overlap = avatarSize * 0.7; // 70% overlap for tighter stack

  const Container: any = onPress ? TouchableOpacity : View;
  const containerProps: any = onPress
    ? { onPress, activeOpacity: 0.7 }
    : { pointerEvents: 'box-none' };

  return (
    <Container
      style={styles.container}
      {...containerProps}
    >
      <View style={styles.avatarStack}>
        {visibleMembers.map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.avatarContainer,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                marginLeft: index > 0 ? -overlap : 0,
                zIndex: index + 1,
              },
            ]}
          >
            <Avatar user={member} size={avatarSize} />
          </View>
        ))}
        {remainingCount > 0 && (
          <View
            style={[
              styles.avatarContainer,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                marginLeft: -overlap,
                zIndex: visibleMembers.length + 1,
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                styles.moreAvatar,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.moreText,
                  {
                    fontSize: avatarSize * 0.35,
                  },
                ]}
              >
                +{remainingCount}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    // remove border/background to eliminate white halo
  },
  avatar: {
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '600',
  },
  moreAvatar: {
    backgroundColor: '#999',
  },
  moreText: {
    color: '#fff',
    fontWeight: '600',
  },
});

