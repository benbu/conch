import { ChatHeaderAvatars } from '@/components/chat/ChatHeaderAvatars';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';

export default function TestChatScreen() {
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const conversationId = Array.isArray(params.id) ? params.id?.[0] ?? null : params.id ?? null;
  const conversation = useChatStore((state) =>
    conversationId ? state.conversations.find((c) => c.id === conversationId) : undefined
  );
  const conversationParticipants = useChatStore((state) => state.conversationParticipants);
  const participants = conversationId ? conversationParticipants[conversationId] || [] : [];
  
  // Get the other user for direct chats
  const otherUser = useMemo(() => {
    if (conversation?.type === 'direct') {
      return participants.find((p: any) => p.id !== user?.id);
    }
    return null;
  }, [conversation?.type, participants, user?.id]);

  const handleHeaderPress = () => {
    console.log('Header title clicked! Conversation ID:', conversationId);
  };

    // Custom header: avatar(s) + title, left-aligned
    const HeaderTitle = () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }} >
            <ChatHeaderAvatars
              type={conversation?.type}
              participants={participants}
              otherUser={otherUser}
              conversationTitle={conversation?.name || conversation?.title}
            />
        </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: false,
          headerBackTitle: '',
          headerStyle: {
            backgroundColor: '#f5f5f5',
          },
          headerTitle: () => (
            <Pressable
              onPress={handleHeaderPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <HeaderTitle />
            </Pressable>
          ),
        }}
      />
      <View style={styles.container}>
        <Text style={styles.infoText}>Test Chat Screen</Text>
        {conversationId && (
          <Text style={styles.conversationId}>
            Conversation ID: {conversationId}
          </Text>
        )}
        <Text style={styles.instructionText}>
          Click the header title to see console log
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  infoText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  conversationId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

