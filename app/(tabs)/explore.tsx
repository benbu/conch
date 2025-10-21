import PresenceIndicator from '@/components/PresenceIndicator';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { globalSearch, SearchResult } from '@/services/searchService';
import { useChatStore } from '@/stores/chatStore';
import { Message, User } from '@/types';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface SearchSection {
  title: string;
  data: SearchResult[];
}

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deepSearchResults, setDeepSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasDeepSearched, setHasDeepSearched] = useState(false);
  
  const { user } = useAuth();
  const { conversations, createConversation } = useConversations();
  const router = useRouter();
  const participantsByConversation = useChatStore((state) => state.conversationParticipants);

  // Build local users from recent conversations
  const localUsers: User[] = useMemo(() => {
    if (!user) return [];
    const userMap: Record<string, User> = {};

    for (const conv of conversations) {
      const participants = participantsByConversation[conv.id] || [];
      for (const participant of participants) {
        if (participant.id !== user.id) {
          userMap[participant.id] = participant;
        }
      }
    }

    return Object.values(userMap);
  }, [conversations, participantsByConversation, user]);

  // Get recent messages from all conversations for local search
  const localMessages: Array<{ message: Message; conversationId: string; conversationTitle: string }> = useMemo(() => {
    const messages: Array<{ message: Message; conversationId: string; conversationTitle: string }> = [];
    
    // Get last few messages from each conversation
    for (const conv of conversations) {
      if (conv.lastMessage) {
        messages.push({
          message: conv.lastMessage,
          conversationId: conv.id,
          conversationTitle: conv.title || 'Chat',
        });
      }
    }

    return messages.sort((a, b) => {
      const timeA = a.message.createdAt?.getTime() || 0;
      const timeB = b.message.createdAt?.getTime() || 0;
      return timeB - timeA;
    });
  }, [conversations]);

  // Local filtering - instant results
  const localFilteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { users: [], messages: [] };

    const filteredUsers = localUsers.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );

    const filteredMessages = localMessages.filter(
      (m) => m.message.text?.toLowerCase().includes(q)
    );

    return { users: filteredUsers, messages: filteredMessages };
  }, [searchQuery, localUsers, localMessages]);

  // Total local results count
  const localResultsCount = localFilteredResults.users.length + localFilteredResults.messages.length;

  // Show deep search button when local results are limited
  const showDeepSearchButton = searchQuery.trim().length >= 3 && localResultsCount <= 3 && !hasDeepSearched;

  // Handle deep search
  const handleDeepSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setHasDeepSearched(true);
      const results = await globalSearch(searchQuery.trim());
      setDeepSearchResults(results);
    } catch (error) {
      console.error('Deep search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset deep search when query changes
  React.useEffect(() => {
    setHasDeepSearched(false);
    setDeepSearchResults([]);
  }, [searchQuery]);

  // Prepare sections for display
  const sections: SearchSection[] = useMemo(() => {
    const results: SearchSection[] = [];

    if (hasDeepSearched) {
      // Show deep search results grouped
      const userResults = deepSearchResults.filter(r => r.type === 'user');
      const messageResults = deepSearchResults.filter(r => r.type === 'message');

      if (userResults.length > 0) {
        results.push({ title: 'People', data: userResults });
      }
      if (messageResults.length > 0) {
        results.push({ title: 'Messages', data: messageResults });
      }
    } else {
      // Show local filtered results
      if (localFilteredResults.users.length > 0) {
        results.push({
          title: 'People',
          data: localFilteredResults.users.map(u => ({
            type: 'user' as const,
            id: u.id,
            data: u,
          })),
        });
      }
      if (localFilteredResults.messages.length > 0) {
        results.push({
          title: 'Messages',
          data: localFilteredResults.messages.map(m => ({
            type: 'message' as const,
            id: m.message.id,
            data: m.message,
            conversationId: m.conversationId,
            conversationTitle: m.conversationTitle,
            timestamp: m.message.createdAt,
          })),
        });
      }
    }

    return results;
  }, [hasDeepSearched, deepSearchResults, localFilteredResults]);

  const handleUserTap = async (userId: string) => {
    try {
      // Find or create conversation with this user
      const existingConv = conversations.find(
        c => c.type === 'direct' && c.participantIds.includes(userId)
      );

      if (existingConv) {
        router.push(`/chat/${existingConv.id}`);
      } else {
        // Create new conversation
        const convId = await createConversation([userId], undefined, 'direct');
        router.push(`/chat/${convId}`);
      }
    } catch (error) {
      console.error('Failed to open chat:', error);
    }
  };

  const handleMessageTap = (conversationId: string, messageId: string) => {
    router.push(`/chat/${conversationId}?messageId=${messageId}`);
  };

  const renderResult = ({ item }: { item: SearchResult }) => {
    if (item.type === 'user') {
      const userData = item.data as User;
      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => handleUserTap(userData.id)}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData.displayName?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.presenceDot}>
              <PresenceIndicator userId={userData.id} user={userData} size="small" />
            </View>
          </View>
          <View style={styles.resultContent}>
            <Text style={styles.resultTitle}>{userData.displayName}</Text>
            <Text style={styles.resultSubtitle}>{userData.email}</Text>
          </View>
          <Text style={styles.actionText}>Chat</Text>
        </TouchableOpacity>
      );
    }

    if (item.type === 'message') {
      const messageData = item.data as Message;
      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => handleMessageTap(item.conversationId!, item.id)}
        >
          <View style={[styles.avatar, styles.messageAvatar]}>
            <Text style={styles.avatarText}>💬</Text>
          </View>
          <View style={styles.resultContent}>
            <Text style={styles.resultTitle}>{item.conversationTitle || 'Chat'}</Text>
            <Text style={styles.messagePreview} numberOfLines={2}>
              {messageData.text}
            </Text>
            {item.timestamp && (
              <Text style={styles.timestamp}>
                {format(item.timestamp, 'MMM d, h:mm a')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderSectionHeader = ({ section }: { section: SearchSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search people and messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : searchQuery.trim().length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Search</Text>
          <Text style={styles.emptyStateText}>
            Search for people and messages across all your conversations
          </Text>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No results found</Text>
          {showDeepSearchButton && (
            <TouchableOpacity
              style={styles.deepSearchButton}
              onPress={handleDeepSearch}
            >
              <Text style={styles.deepSearchButtonText}>🔍 Search for more results</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <SectionList
            sections={sections}
            renderItem={renderResult}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={true}
          />
          {showDeepSearchButton && (
            <View style={styles.deepSearchContainer}>
              <TouchableOpacity
                style={styles.deepSearchButton}
                onPress={handleDeepSearch}
              >
                <Text style={styles.deepSearchButtonText}>🔍 Search for more results</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  resultItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 2,
  },
  messageAvatar: {
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  messagePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  actionText: {
    color: '#007AFF',
    fontSize: 16,
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
    marginBottom: 16,
  },
  deepSearchContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  deepSearchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  deepSearchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

