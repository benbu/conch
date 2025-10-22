import Avatar from '@/components/Avatar';
import OverlappingAvatars from '@/components/OverlappingAvatars';
import PresenceIndicator from '@/components/PresenceIndicator';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { searchUsers as searchUsersFirestore } from '@/services/firestoreService';
import { SearchResult, searchUsers as searchUsersGlobal } from '@/services/searchService';
import { useChatStore } from '@/stores/chatStore';
import { Conversation, User } from '@/types';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatsScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { conversations, createConversation } = useConversations();
  const { user } = useAuth();
  const router = useRouter();
  const conversationParticipants = require('../../stores/chatStore').useChatStore.getState().conversationParticipants;
  const computedNames = require('../../stores/chatStore').useChatStore.getState().computedConversationNames;
  const participantsByConversation = useChatStore((state) => state.conversationParticipants);

  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<User[]>([]);

  // Build recent direct message users from conversations
  const recentUsers: User[] = useMemo(() => {
    if (!user) return [];
    const latestByUserId: Record<string, { user: User; lastMessageAt: Date }> = {};

    for (const conv of conversations) {
      if (conv.type !== 'direct') continue;
      const participants = participantsByConversation[conv.id] || [];
      const other = participants.find((p) => p.id !== user.id);
      if (other) {
        const existing = latestByUserId[other.id];
        if (!existing || (conv.lastMessageAt && conv.lastMessageAt > existing.lastMessageAt)) {
          latestByUserId[other.id] = { user: other, lastMessageAt: conv.lastMessageAt };
        }
      }
    }

    return Object.values(latestByUserId)
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
      .map((entry) => entry.user);
  }, [conversations, participantsByConversation, user]);

  const localFilteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recentUsers;
    return recentUsers.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [recentUsers, searchQuery]);

  // Remote fallback search when no local matches and query length >= 3
  useEffect(() => {
    let cancelled = false;
    const q = searchQuery.trim();
    if (q.length < 3 || localFilteredUsers.length > 0) {
      setRemoteUsers([]);
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);
    const timer = setTimeout(async () => {
      try {
        const [byEmail, byIndex] = await Promise.all([
          searchUsersFirestore(q.toLowerCase()),
          (async () => {
            const results: SearchResult[] = await searchUsersGlobal(q);
            return results
              .filter((r) => r.type === 'user')
              .map((r) => r.data as User);
          })(),
        ]);

        const mergedMap: Record<string, User> = {};
        for (const u of [...byEmail, ...byIndex]) {
          if (!u || u.id === user?.id) continue;
          mergedMap[u.id] = u;
        }

        if (!cancelled) setRemoteUsers(Object.values(mergedMap));
      } catch (e) {
        if (!cancelled) setRemoteUsers([]);
      } finally {
        if (!cancelled) setLoadingSearch(false);
      }
    }, 300); // debounce

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, localFilteredUsers.length, user?.id]);

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherParticipants = item.participantIds.filter((id) => id !== user?.id);
    const computed = computedNames[item.id];
    let displayTitle = computed;
    const participantsForConv = conversationParticipants[item.id] || [];
    const others = participantsForConv.filter((p: any) => p.id !== user?.id);
    
    if (!displayTitle) {
      if (item.type === 'group' && item.name) {
        displayTitle = item.name;
      } else if (others.length > 0) {
        const full = others.map((u: any) => u.displayName).join(', ');
        displayTitle = full.length <= 30 ? full : others.map((u: any) => u.displayName.slice(0, 5)).join(', ');
      } else {
        displayTitle = item.title || (otherParticipants.length > 1 ? `Group (${otherParticipants.length + 1})` : 'Chat');
      }
    }

    // For direct chats, show presence of the other user
    const otherUser = item.type === 'direct' && others.length > 0 ? others[0] : null;
    const isGroup = item.type === 'group';

    return (
      <TouchableOpacity
        testID={`conversation-item-${item.id}`}
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        {isGroup ? (
          <View style={styles.groupAvatarContainer}>
            <OverlappingAvatars
              members={others.slice(0, 3)}
              maxVisible={2}
              size="small"
            />
          </View>
        ) : (
          <View style={styles.avatarContainer}>
            <Avatar user={otherUser || undefined} size={50} />
            {otherUser && (
              <View style={styles.presenceDot}>
                <PresenceIndicator userId={otherUser.id} user={otherUser} size="small" />
              </View>
            )}
          </View>
        )}

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationTitle} numberOfLines={1}>
              {displayTitle}
              {isGroup && ` (${item.participantIds.length})`}
            </Text>
            {item.lastMessageAt && (
              <Text style={styles.timestamp}>
                {format(item.lastMessageAt, 'MMM d')}
              </Text>
            )}
          </View>

          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage.text}
            </Text>
          )}

          {item.unreadCount && item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No conversations yet</Text>
          <Text style={styles.emptyStateText}>
            Tap the + button to start a new chat
          </Text>
        </View>
      ) : (
        <FlatList
          testID="conversations-list"
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 12, paddingBottom: tabBarHeight + 16 }]}
        />
      )}

      {/* Floating New Chat Button */}
      <TouchableOpacity
        testID="new-conversation-button"
        style={[styles.fab, { bottom: tabBarHeight + 16 }]}
        onPress={() => {
          setSearchQuery('');
          setRemoteUsers([]);
          setShowNewChat(true);
        }}
        accessibilityLabel="Start a new chat"
        accessibilityRole="button"
      >
        <IconSymbol name="plus.message" color="#fff" size={28} />
      </TouchableOpacity>

      {/* New Chat Overlay */}
      <Modal visible={showNewChat} animationType="fade" transparent onRequestClose={() => setShowNewChat(false)}>
        <View style={styles.modalBackdrop}>
          <View testID="new-conversation-modal" style={styles.modalCard}>
            <View style={styles.searchBarRow}>
              <TextInput
                testID="user-search-input"
                style={styles.searchInput}
                placeholder="Search or start a new chat..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowNewChat(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {loadingSearch ? (
              <View style={styles.centered}> 
                <ActivityIndicator size="large" />
              </View>
            ) : (
              <FlatList
                data={localFilteredUsers.length > 0 || searchQuery.trim().length < 3 ? localFilteredUsers : remoteUsers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={() => (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>
                      {searchQuery.trim().length >= 3 ? 'No users found' : 'Recent chats appear here'}
                    </Text>
                  </View>
                )}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    testID={`user-search-result-${index}`}
                    style={styles.userRow}
                    onPress={async () => {
                      try {
                        const conversationId = await createConversation([item.id], undefined, 'direct');
                        setShowNewChat(false);
                        router.push(`/chat/${conversationId}`);
                      } catch (error) {
                        console.error('Failed to start chat', error);
                      }
                    }}
                  >
                    <View style={styles.avatarContainer}> 
                      <Avatar user={item} size={50} />
                      <View style={styles.presenceDot}>
                        <PresenceIndicator userId={item.id} user={item} size="small" />
                      </View>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.displayName}>{item.displayName}</Text>
                      <Text style={styles.email}>{item.email}</Text>
                    </View>
                    <Text style={styles.startChatText}>Chat</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  // New Chat FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // New Chat Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 16,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  startChatText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  groupAvatarContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 2,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#000',
  },
  lastMessage: {
    fontSize: 14,
    color: '#222',
  },
  unreadBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
