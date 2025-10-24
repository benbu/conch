import { ThemedConversationListItem } from '@/components/preview/ThemedConversationListItem';
import { useConversations } from '@/hooks/useConversations';
import { useChatStore } from '@/stores/chatStore';
import { getPreviewTheme, LayoutVariant, PREVIEW_THEMES, SizeVariant } from '@/themes/previewThemes';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function ChatListPreviewScreen() {
  const params = useLocalSearchParams<{ theme?: string; size?: string; layout?: string }>();
  const router = useRouter();
  const { conversations } = useConversations();
  const participantsByConversation = useChatStore((s) => s.conversationParticipants);

  const theme = getPreviewTheme(params.theme) || PREVIEW_THEMES['glass-aurora'];
  const [size] = useState<SizeVariant>((params.size as SizeVariant) || 'cozy');
  const [layout] = useState<LayoutVariant>((params.layout as LayoutVariant) || 'standard');

  const themeId = useMemo(() => {
    const key = Array.isArray(params.theme) ? params.theme[0] : params.theme;
    return (key && PREVIEW_THEMES[key as keyof typeof PREVIEW_THEMES]) ? key : 'glass-aurora';
  }, [params.theme]);

  const handleOpenConversation = (id: string) => {
    const query = `?theme=${themeId}&size=${size}&layout=${layout}`;
    router.push(`/preview/chat/${id}${query}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: typeof theme.appBackground === 'string' ? theme.appBackground : 'transparent' }}>
      {/* Simple gradient simulation fallback: leave app layout gradient as-is */}
      <View style={{ paddingTop: 56, paddingBottom: 8, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Chat List Preview</Text>
        <Text style={{ marginTop: 2 }}>{theme.name} · {size} · {layout}</Text>
      </View>

      {/* Controls removed: size/layout are selected from Developer Tools */}

      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}>
        {conversations.map((conv) => (
          <ThemedConversationListItem
            key={conv.id}
            tokens={theme}
            size={size}
            conversation={conv}
            participants={participantsByConversation[conv.id]}
            onPress={() => handleOpenConversation(conv.id)}
          />
        ))}
        {conversations.length === 0 && (
          <View style={{ padding: 24 }}>
            <Text>No conversations yet.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}


