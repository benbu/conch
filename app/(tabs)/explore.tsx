import Avatar from '@/components/Avatar';
import GroupNameModal from '@/components/GroupNameModal';
import PresenceIndicator from '@/components/PresenceIndicator';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { SearchResult, searchUsers as userSearch } from '@/services/searchService';
import { useChatStore } from '@/stores/chatStore';
import { User } from '@/types';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SearchSection {
  title: string;
  data: SearchResult[];
}

export default function ExploreScreen() {
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [deepSearchResults, setDeepSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasDeepSearched, setHasDeepSearched] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showGroupNameModal, setShowGroupNameModal] = useState(false);
  
  const { user } = useAuth();
  const { conversations, createConversation } = useConversations();
  const router = useRouter();
  const params = useLocalSearchParams<{ startGroup?: string }>();
  const participantsByConversation = useChatStore((state) => state.conversationParticipants);

  // Auto-enter multi-select mode if navigated with startGroup flag
  React.useEffect(() => {
    if (params?.startGroup && !isMultiSelectMode) {
      setIsMultiSelectMode(true);
    }
  }, [params?.startGroup, isMultiSelectMode]);

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

  // Local filtering - people only
  const localFilteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as User[];

    return localUsers.filter(
      (u) =>
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [searchQuery, localUsers]);

  // Total local results count (users only)
  const localResultsCount = localFilteredUsers.length;

  // Show deep search button when local results are limited
  const showDeepSearchButton = searchQuery.trim().length >= 3 && localResultsCount <= 3 && !hasDeepSearched;

  // Handle deep search
  const handleDeepSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setHasDeepSearched(true);
      const results = await userSearch(searchQuery.trim());
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

  // Prepare sections for display (People only)
  const sections: SearchSection[] = useMemo(() => {
    const results: SearchSection[] = [];
    const q = searchQuery.trim();

    if (q.length === 0) {
      // Show all known users by default
      if (localUsers.length > 0) {
        results.push({
          title: 'People',
          data: localUsers.map((u) => ({
            type: 'user' as const,
            id: u.id,
            data: u,
          })),
        });
      }
      return results;
    }

    if (hasDeepSearched) {
      const userResults = deepSearchResults.filter((r) => r.type === 'user');
      if (userResults.length > 0) {
        results.push({ title: 'People', data: userResults });
      }
      return results;
    }

    if (localFilteredUsers.length > 0) {
      results.push({
        title: 'People',
        data: localFilteredUsers.map((u) => ({
          type: 'user' as const,
          id: u.id,
          data: u,
        })),
      });
    }

    return results;
  }, [searchQuery, hasDeepSearched, deepSearchResults, localUsers, localFilteredUsers]);

  const toggleUserSelection = (selectedUser: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === selectedUser.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== selectedUser.id);
      } else {
        return [...prev, selectedUser];
      }
    });
    
    if (!isMultiSelectMode) {
      setIsMultiSelectMode(true);
    }
  };

  const handleUserTap = async (selectedUser: User) => {
    // If in multi-select mode, toggle selection
    if (isMultiSelectMode) {
      toggleUserSelection(selectedUser);
      return;
    }

    try {
      // Find or create conversation with this user
      const existingConv = conversations.find(
        c => c.type === 'direct' && c.participantIds.includes(selectedUser.id)
      );

      if (existingConv) {
        router.push(`/chat/view-chat?id=${existingConv.id}`);
      } else {
        // Create new conversation
        const convId = await createConversation([selectedUser.id], undefined, 'direct');
        if (convId) {
          router.push(`/chat/view-chat?id=${convId}`);
        } else {
          console.error('Failed to create conversation: No ID returned');
        }
      }
    } catch (error) {
      console.error('Failed to open chat:', error);
    }
  };

  const handleCreateGroup = () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least 1 user');
      return;
    }
    if (selectedUsers.length === 1) {
      // Single user -> direct chat
      const only = selectedUsers[0];
      (async () => {
        try {
          const existingConv = conversations.find(
            (c) => c.type === 'direct' && c.participantIds.includes(only.id)
          );
          if (existingConv) {
            router.push(`/chat/view-chat?id=${existingConv.id}`);
            return;
          }
          const convId = await createConversation([only.id], undefined, 'direct');
          if (convId) {
            router.push(`/chat/view-chat?id=${convId}`);
          } else {
            console.error('Failed to create conversation: No ID returned');
            Alert.alert('Error', 'Failed to start chat');
          }
        } catch (error) {
          console.error('Failed to start chat', error);
          Alert.alert('Error', 'Failed to start chat');
        }
      })();
      return;
    }
    // 2+ users -> group flow
    setShowGroupNameModal(true);
  };

  const handleGroupNameSubmit = async (groupName: string) => {
    try {
      const participantIds = selectedUsers.map((u) => u.id);
      const convId = await createConversation(participantIds, undefined, 'group', groupName);
      
      if (convId) {
        // Reset selection state
        setSelectedUsers([]);
        setIsMultiSelectMode(false);
        
        // Navigate to new group
        router.push(`/chat/view-chat?id=${convId}`);
      } else {
        console.error('Failed to create group: No ID returned');
        Alert.alert('Error', 'Failed to create group chat');
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group chat');
    }
  };

  const cancelMultiSelect = () => {
    setSelectedUsers([]);
    setIsMultiSelectMode(false);
    setSearchQuery('');
    router.push('/(tabs)');
  };

  const handleMessageTap = (conversationId: string, messageId: string) => {
    router.push(`/chat/view-chat?id=${conversationId}&messageId=${messageId}`);
  };

  const renderResult = ({ item }: { item: SearchResult }) => {
    const userData = item.data as User;
    const isSelected = selectedUsers.some((u) => u.id === userData.id);

    return (
      <TouchableOpacity
        style={[styles.resultItem, isSelected && styles.resultItemSelected]}
        onPress={() => handleUserTap(userData)}
        onLongPress={() => toggleUserSelection(userData)}
      >
        {isMultiSelectMode && (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}
        <View style={styles.avatarContainer}>
          <Avatar user={userData} size={50} />
          <View style={styles.presenceDot}>
            <PresenceIndicator userId={userData.id} user={userData} size="small" />
          </View>
        </View>
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle}>{userData.displayName}</Text>
          <Text style={styles.resultSubtitle}>{userData.email}</Text>
        </View>
        {!isMultiSelectMode && <Text style={styles.actionText}>Chat</Text>}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: SearchSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom:
            tabBarHeight + (isMultiSelectMode && selectedUsers.length >= 1 ? 96 : 0),
        },
      ]}
    >
      <View style={styles.searchContainer}>
        {isMultiSelectMode && (
          <View style={styles.selectionHeader}>
            <TouchableOpacity onPress={cancelMultiSelect}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.selectionCount}>
              {selectedUsers.length} selected
            </Text>
          </View>
        )}
        <TextInput
          style={styles.searchInput}
          placeholder="Search people..."
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
      ) : sections.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No people found</Text>
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
                <Text style={styles.deepSearchButtonText}>🔍 Show more results...</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Floating action button for group creation */}
      {isMultiSelectMode && selectedUsers.length >= 1 && (
        <View style={[styles.fab, { bottom: tabBarHeight + 24 }]}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleCreateGroup}
          >
            <Text style={styles.fabText}>
              {selectedUsers.length === 1 ? 'Start Chat' : `Create Group (${selectedUsers.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Group name modal */}
      <GroupNameModal
        visible={showGroupNameModal}
        onClose={() => setShowGroupNameModal(false)}
        onSubmit={handleGroupNameSubmit}
        participantCount={selectedUsers.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'rgba(255,255,255,0.85)',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  deepSearchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  deepSearchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  multiSelectButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  multiSelectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  fabButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

