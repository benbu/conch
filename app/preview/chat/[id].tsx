import { ChatHeaderAvatars } from '@/components/chat/ChatHeaderAvatars';
import { ThemedInputBar } from '@/components/preview/ThemedInputBar';
import { ThemedMessageBubble } from '@/components/preview/ThemedMessageBubble';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useUserPresence } from '@/hooks/usePresence';
import { useTranslations } from '@/hooks/useTranslations';
import { useChatStore } from '@/stores/chatStore';
import { getPreviewTheme, LayoutVariant, PREVIEW_THEMES, SizeVariant } from '@/themes/previewThemes';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

export default function ChatPreviewScreen() {
  const params = useLocalSearchParams<{ id?: string; theme?: string; size?: string; layout?: string }>();
  const conversationId = Array.isArray(params.id) ? params.id?.[0] ?? null : params.id ?? null;

  const theme = getPreviewTheme(params.theme) || PREVIEW_THEMES['glass-aurora'];
  const [size, setSize] = useState<SizeVariant>((params.size as SizeVariant) || 'cozy');
  const [layout] = useState<LayoutVariant>((params.layout as LayoutVariant) || 'standard');

  const { messages, sendMessage } = useMessages(conversationId);
  const { user } = useAuth();
  const participantsByConversation = useChatStore((s) => s.conversationParticipants);
  const currentUserId = user?.id;

  const flatListRef = useRef<FlatList>(null);

  const participants = useMemo(() => (conversationId ? participantsByConversation[conversationId] || [] : []), [participantsByConversation, conversationId]);
  const otherUser = useMemo(() => participants.find((p: any) => p.id !== currentUserId), [participants, currentUserId]);
  const { presence } = useUserPresence(otherUser?.id);

  const translations = useTranslations(
    conversationId,
    messages.map((m) => m.id)
  );

  const [draft, setDraft] = useState('');

  const handleSend = async () => {
    if (!draft.trim() || !conversationId) return;
    try {
      await sendMessage(draft.trim());
      setDraft('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: typeof theme.appBackground === 'string' ? theme.appBackground : 'transparent' }}>
      <View style={{ paddingTop: 56, paddingBottom: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ChatHeaderAvatars type={participants.length > 2 ? 'group' : 'direct'} participants={participants} otherUser={otherUser} conversationTitle={undefined} />
          <Text style={{ marginLeft: 8 }}>{presence?.status === 'online' ? 'Online' : 'Offline'}</Text>
        </View>
        <Text style={{ fontSize: 12, opacity: 0.8 }}>{theme.name} · {size} · {layout}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        contentContainerStyle={{ padding: 16 }}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => {
          const isOwn = item.senderId === currentUserId;
          const ts = format(item.createdAt, 'p');
          const translationDoc = translations.get(item.id);
          const translationText = translationDoc?.translation || null;
          return (
            <ThemedMessageBubble
              tokens={theme}
              message={item}
              isOwn={!!isOwn}
              size={size}
              layout={layout}
              timestampText={ts}
              conversationType={participants.length > 2 ? 'group' : 'direct'}
              translationText={translationText}
            />
          );
        }}
      />

      <ThemedInputBar tokens={theme} size={size} value={draft} onChangeText={setDraft} onSend={handleSend} />
    </View>
  );
}


