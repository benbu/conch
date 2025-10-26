import Avatar from '@/components/Avatar';
import PresenceIndicator from '@/components/PresenceIndicator';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { searchUsers as searchUsersFirestore } from '@/services/firestoreService';
import { SearchResult, searchUsers as searchUsersGlobal } from '@/services/searchService';
import { useChatStore } from '@/stores/chatStore';
import { User } from '@/types';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewMessageScreen() {
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { conversations, createConversation } = useConversations();
  const { user } = useAuth();
  const router = useRouter();
  const participantsByConversation = useChatStore((state) => state.conversationParticipants);

  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<User[]>([]);

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
      (u) => u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    );
  }, [recentUsers, searchQuery]);

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
            return results.filter((r) => r.type === 'user').map((r) => r.data as User);
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
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, localFilteredUsers.length, user?.id]);

  return (
    <View style={[styles.container, { paddingBottom: tabBarHeight }]}>
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
                {searchQuery.trim().length >= 3 ? 'No users found' : 'No recent chats'}
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
                  if (conversationId) {
                    router.push(`/chat/view-chat?id=${conversationId}`);
                  } else {
                    console.error('Failed to create conversation: No ID returned');
                  }
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
    fontSize: 18,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  startChatText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});


