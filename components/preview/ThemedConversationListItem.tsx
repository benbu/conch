import { ChatUITokens, SizeVariant } from '@/themes/previewThemes';
import { Conversation, User } from '@/types';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  tokens: ChatUITokens;
  size: SizeVariant;
  conversation: Conversation;
  participants?: User[];
  onPress: () => void;
}

export function ThemedConversationListItem({ tokens, size, conversation, participants, onPress }: Props) {
  const avatarSize = size === 'compact' ? 36 : size === 'cozy' ? 40 : 48;
  const titleSize = size === 'compact' ? 15 : size === 'cozy' ? 16 : 17;
  const subtitleSize = size === 'compact' ? 12 : 13;

  const title = conversation.name || conversation.title || participants?.map(p => p.displayName).filter(Boolean).slice(0, 3).join(', ') || 'Conversation';
  const lastText = conversation.lastMessage?.text || '';

  const first = participants && participants[0];

  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: tokens.cardBackground }}>
      <View style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: '#CCC', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {first?.photoURL ? (
          <Image source={{ uri: first.photoURL }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={{ fontWeight: '700' }}>{first?.displayName?.slice(0,1) || 'C'}</Text>
        )}
      </View>
      <View style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: tokens.separator, paddingBottom: 12 }}>
        <Text numberOfLines={1} style={{ fontSize: titleSize, fontWeight: '600' }}>{title}</Text>
        {!!lastText && (
          <Text numberOfLines={1} style={{ fontSize: subtitleSize, color: '#666', marginTop: 2 }}>{lastText}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}


