import Avatar from '@/components/Avatar';
import OverlappingAvatars from '@/components/OverlappingAvatars';
import PresenceIndicator from '@/components/PresenceIndicator';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { deleteConversation as deleteConversationApi, searchUsers as searchUsersFirestore } from '@/services/firestoreService';
import { SearchResult, searchUsers as searchUsersGlobal } from '@/services/searchService';
import { useChatStore } from '@/stores/chatStore';
import { Conversation, User } from '@/types';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
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
  const [activeActionForId, setActiveActionForId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    const canDelete = (item.createdBy === user?.id) || ((item.members || []).some((m: any) => m.userId === user?.id && m.role === 'admin'));

    const handleConfirmDelete = (conversationId: string) => {
      Alert.alert(
        'Delete conversation?',
        'This will delete the chat and all messages for all participants.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setDeletingId(conversationId);
              try {
                await deleteConversationApi(conversationId);
                setActiveActionForId(null);
              } catch (e: any) {
                Alert.alert('Failed to delete', e?.message || 'Please try again.');
              } finally {
                setDeletingId(null);
              }
            },
          },
        ]
      );
    };

    return (
      <TouchableOpacity
        testID={`conversation-item-${item.id}`}
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/test-chat?id=${item.id}`)}
        onLongPress={() => {
          if (canDelete) setActiveActionForId(item.id);
        }}
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

          {activeActionForId === item.id && canDelete && (
            <View style={styles.rowActions}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => handleConfirmDelete(item.id)}
                disabled={deletingId === item.id}
                style={[styles.deleteButton, deletingId === item.id && styles.deleteButtonDisabled]}
              >
                <Text style={styles.deleteButtonText}>
                  {deletingId === item.id ? 'Deleting…' : 'Delete'}
                </Text>
              </TouchableOpacity>
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
            Use the New tab to start a chat
          </Text>
        </View>
      ) : (
        <FlatList
          testID="conversations-list"
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          //contentContainerStyle={[styles.listContent, { paddingTop: insets.top + 12, paddingBottom: tabBarHeight + 16 }]}
        />
      )}
      {/* New chat flow moved to New tab */}
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
    fontSize: 23,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  timestamp: {
    fontSize: 14,
    color: '#000',
  },
  lastMessage: {
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '600',
  },
  rowActions: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 23,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginLeft: 62, // 50px avatar + 12px marginRight
  },
});
