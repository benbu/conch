import { AIActionsList } from '@/components/AIActionsList';
import { AIDecisionsList } from '@/components/AIDecisionsList';
import { AIFeatureMenu } from '@/components/AIFeatureMenu';
import { AIPriorityBadge } from '@/components/AIPriorityBadge';
import { AISummarySheet } from '@/components/AISummarySheet';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import GroupNameModal from '@/components/GroupNameModal';
import MemberManagementModal from '@/components/MemberManagementModal';
import { MessageBubble } from '@/components/MessageBubble';
import OverlappingAvatars from '@/components/OverlappingAvatars';
import PresenceIndicator from '@/components/PresenceIndicator';
import { useAIActions } from '@/hooks/useAIActions';
import { useAIDecisions } from '@/hooks/useAIDecisions';
import { useAIPriority } from '@/hooks/useAIPriority';
import { useAISummary } from '@/hooks/useAISummary';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useUserPresence } from '@/hooks/usePresence';
import { pickImageFromGallery, uploadConversationImage } from '@/services/imageService';
import { useChatStore } from '@/stores/chatStore';
import { Message, User } from '@/types';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; messageId?: string | string[] }>();
  const conversationId = Array.isArray(params.id) ? params.id?.[0] ?? null : params.id ?? null;
  const targetMessageId = Array.isArray(params.messageId) ? params.messageId?.[0] : params.messageId;
  
  const [messageText, setMessageText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showDecisions, setShowDecisions] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [showGroupNameModal, setShowGroupNameModal] = useState(false);
  const [showAddMemberSearch, setShowAddMemberSearch] = useState(false);
  
  const flatListRef = React.useRef<FlatList>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { messages, loading, loadingMore, hasMore, sendMessage, loadMoreMessages } = useMessages(conversationId);
  const { updateGroupName, addGroupMember, updateMemberRole, leaveGroup, removeMember } = useConversations();
  const conversation = useChatStore((state) =>
    conversationId ? state.conversations.find((c) => c.id === conversationId) : undefined
  );

  // Get conversation participants
  const conversationParticipants = useChatStore((state) => state.conversationParticipants);
  const participants = conversationId ? conversationParticipants[conversationId] || [] : [];
  
  // Get the other user for direct chats
  const otherUser = useMemo(() => {
    if (conversation?.type === 'direct') {
      return participants.find((p: any) => p.id !== user?.id);
    }
    return null;
  }, [conversation?.type, participants, user?.id]);

  // Get presence for the other user
  const { presence } = useUserPresence(otherUser?.id);

  // Get members with roles for group chats
  const membersWithRoles = useMemo(() => {
    if (conversation?.type !== 'group' || !conversation.members) {
      return [];
    }

    return participants.map((p: User) => {
      const memberInfo = conversation.members?.find((m) => m.userId === p.id);
      return {
        ...p,
        role: memberInfo?.role || 'user',
      };
    });
  }, [conversation, participants]);

  // Get current user's role
  const currentUserRole = conversation?.members?.find((m) => m.userId === user?.id)?.role;

  // AI hooks
  const aiSummary = useAISummary(conversationId, { autoLoad: true });
  const aiActions = useAIActions(conversationId, { autoLoad: true });
  const aiDecisions = useAIDecisions(conversationId, { autoLoad: true });
  const aiPriority = useAIPriority(conversationId, { autoLoad: true });

  useEffect(() => {
    useChatStore.getState().setCurrentConversation(conversationId);
    return () => {
      useChatStore.getState().setCurrentConversation(null);
    };
  }, [conversationId]);

  // Scroll to target message when messages load
  useEffect(() => {
    if (targetMessageId && messages.length > 0 && !loading) {
      const messageIndex = messages.findIndex(m => m.id === targetMessageId);
      if (messageIndex !== -1) {
        // Wait a bit for the list to render
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: messageIndex,
            animated: true,
            viewPosition: 0.5, // Center the message
          });
          // Highlight the message briefly
          setHighlightedMessageId(targetMessageId);
          setTimeout(() => setHighlightedMessageId(null), 2000);
        }, 300);
      }
    }
  }, [targetMessageId, messages.length, loading]);

  const handleSend = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage(messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Don't show error - message is queued
    }
  };

  const handleImagePick = async () => {
    try {
      const image = await pickImageFromGallery();
      if (!image || !conversationId) return;

      setUploading(true);
      
      const imageUrl = await uploadConversationImage(conversationId, image.uri, (progress) => {
        console.log(`Upload progress: ${progress.progress.toFixed(0)}%`);
      });

      await sendMessage('📷 Photo', [{
        id: Date.now().toString(),
        type: 'image' as const,
        url: imageUrl,
        name: 'photo.jpg',
        size: image.fileSize || 0,
        mimeType: 'image/jpeg',
        thumbnailUrl: imageUrl,
      }]);

      setUploading(false);
    } catch (error: any) {
      setUploading(false);
      Alert.alert('Upload Failed', error.message);
    }
  };

  const handleRetry = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      try {
        await sendMessage(message.text, message.attachments);
      } catch (error) {
        console.error('Retry failed:', error);
      }
    }
  };

  const handleLoadMore = async () => {
    const count = await loadMoreMessages();
    if (count === 0) {
      // No more messages
    }
  };

  // Group management handlers
  const handleUpdateGroupName = async (name: string) => {
    if (!conversationId) return;
    try {
      await updateGroupName(conversationId, name);
    } catch (error) {
      Alert.alert('Error', 'Failed to update group name');
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: 'admin' | 'team' | 'user') => {
    if (!conversationId) return;
    try {
      await updateMemberRole(conversationId, userId, newRole);
    } catch (error) {
      Alert.alert('Error', 'Failed to update member role');
    }
  };

  const handleLeaveGroup = async () => {
    if (!conversationId) return;
    try {
      await leaveGroup(conversationId);
      // Navigate back
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to leave group');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!conversationId) return;
    try {
      await removeMember(conversationId, userId);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove member');
    }
  };

  const handleAddMembers = () => {
    setShowMemberManagement(false);
    // TODO: Show user search/selection modal
    Alert.alert('Add Members', 'User search functionality coming soon');
  };

  // Throttled top-of-list pagination
  const topLoadThrottleRef = React.useRef(0);
  const onScroll = ({ nativeEvent }: any) => {
    const y = nativeEvent?.contentOffset?.y ?? 0;
    if (y <= 32) {
      const now = Date.now();
      if (now - topLoadThrottleRef.current < 500) return;
      if (loadingMore || !hasMore) return;
      topLoadThrottleRef.current = now;
      handleLoadMore();
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id;
    const priorityScore = aiPriority.getPriorityScore(item.id);
    const isHighlighted = item.id === highlightedMessageId;
    
    // Determine if we should show avatar for this message
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !isOwn && (!previousMessage || previousMessage.senderId !== item.senderId);
    const avatarUrl = !isOwn && item.sender?.photoURL ? item.sender.photoURL : null;
    
    return (
      <View style={isHighlighted ? styles.highlightedMessageContainer : undefined}>
        {priorityScore && priorityScore >= 6 && (
          <AIPriorityBadge 
            score={priorityScore}
            reason={aiPriority.priority?.priorityMessages.find((p: any) => p.messageId === item.id)?.reason}
          />
        )}
        <MessageBubble 
          message={item} 
          isOwn={isOwn} 
          showAvatar={showAvatar}
          avatarUrl={avatarUrl}
          onRetry={handleRetry} 
        />
      </View>
    );
  };

  if (!conversationId) {
    return (
      <View style={styles.centered}>
        <Text>Invalid conversation. Please go back and try again.</Text>
      </View>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Custom header title - centered avatars
  const HeaderTitle = () => {
    if (conversation?.type === 'group') {
      return (
        <OverlappingAvatars
          members={participants}
          maxVisible={3}
          size="small"
          onPress={() => setShowMemberManagement(true)}
        />
      );
    }

    // Direct chat - single avatar
    if (otherUser) {
      return (
        <View style={styles.singleAvatarContainer}>
          <View style={styles.singleAvatar}>
            <Text style={styles.singleAvatarText}>
              {otherUser.displayName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        </View>
      );
    }
    
    return null;
  };

  // Floating title bar component
  const FloatingTitleBar = () => {
    if (conversation?.type === 'group') {
      return (
        <TouchableOpacity 
          style={styles.floatingTitleBar}
          onPress={() => {
            if (currentUserRole === 'admin') {
              setShowGroupNameModal(true);
            }
          }}
          activeOpacity={currentUserRole === 'admin' ? 0.7 : 1}
        >
          <Text style={styles.floatingTitle}>
            {conversation.name || conversation.title || 'Group Chat'}
          </Text>
          <Text style={styles.floatingSubtitle}>
            {participants.length} member{participants.length !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      );
    }

    // Direct chat
    if (otherUser) {
      const effectiveStatus = otherUser?.appearOffline ? 'offline' : presence?.status || 'offline';
      
      return (
        <View style={styles.floatingTitleBar}>
          <Text style={styles.floatingTitle}>
            {otherUser.displayName || 'Chat'}
          </Text>
          <View style={styles.floatingPresence}>
            <PresenceIndicator userId={otherUser.id} user={otherUser} size="small" />
            <Text style={styles.floatingPresenceText}>
              {effectiveStatus === 'online' ? 'Online' : effectiveStatus === 'away' ? 'Away' : 'Offline'}
            </Text>
            {presence?.customStatus && (
              <Text style={styles.floatingCustomStatus}> • {presence.customStatus}</Text>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <HeaderTitle />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowAIMenu(true)}
              style={styles.aiButton}
            >
              <Text style={styles.aiButtonText}>✨ AI</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ConnectionBanner />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <FloatingTitleBar />
        <FlatList
          ref={flatListRef}
          testID="chat-messages-list"
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          inverted={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={(info) => {
            // Handle scroll failure by trying again
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.5,
              });
            }, 100);
          }}
          ListHeaderComponent={
            loadingMore ? <ActivityIndicator style={styles.loadingMore} /> : null
          }
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity 
            testID="chat-image-button"
            style={styles.imageButton}
            onPress={handleImagePick}
            disabled={uploading}
          >
            <Text style={styles.imageButtonText}>📷</Text>
          </TouchableOpacity>
          
          <TextInput
            testID="chat-message-input"
            style={styles.input}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            editable={!uploading}
          />
          
          <TouchableOpacity
            testID="chat-send-button"
            style={[styles.sendButton, (!messageText.trim() || uploading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim() || uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* AI Feature Menu */}
      <AIFeatureMenu
        visible={showAIMenu}
        onClose={() => setShowAIMenu(false)}
        onSummary={() => {
          setShowSummary(true);
          if (!aiSummary.summary) aiSummary.refresh();
        }}
        onActions={() => {
          setShowActions(true);
          if (!aiActions.actions) aiActions.refresh();
        }}
        onDecisions={() => {
          setShowDecisions(true);
          if (aiDecisions.decisions.length === 0) aiDecisions.refresh();
        }}
        onPriority={() => {
          aiPriority.refresh();
        }}
      />

      {/* AI Summary Sheet */}
      <AISummarySheet
        visible={showSummary}
        onClose={() => setShowSummary(false)}
        summary={aiSummary.summary}
        loading={aiSummary.loading}
        error={aiSummary.error}
        onRefresh={aiSummary.refresh}
      />

      {/* AI Actions List */}
      <AIActionsList
        visible={showActions}
        onClose={() => setShowActions(false)}
        actions={aiActions.actions}
        loading={aiActions.loading}
        error={aiActions.error}
        onRefresh={aiActions.refresh}
      />

      {/* AI Decisions List */}
      <AIDecisionsList
        visible={showDecisions}
        onClose={() => setShowDecisions(false)}
        decisions={aiDecisions.decisions}
        loading={aiDecisions.loading}
        error={aiDecisions.error}
        onRefresh={aiDecisions.refresh}
      />

      {/* Group Management Modals */}
      {conversation?.type === 'group' && user && (
        <>
          <MemberManagementModal
            visible={showMemberManagement}
            onClose={() => setShowMemberManagement(false)}
            members={membersWithRoles as any}
            currentUserId={user.id}
            onAddMembers={handleAddMembers}
            onUpdateRole={handleUpdateMemberRole}
            onLeaveGroup={handleLeaveGroup}
            onRemoveMember={currentUserRole === 'admin' ? handleRemoveMember : undefined}
          />

          {currentUserRole === 'admin' && (
            <GroupNameModal
              visible={showGroupNameModal}
              onClose={() => setShowGroupNameModal(false)}
              onSubmit={handleUpdateGroupName}
              initialName={conversation.name || conversation.title || ''}
              participantCount={participants.length}
            />
          )}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
  },
  loadingMore: {
    paddingVertical: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 8,
  },
  imageButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  imageButtonText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 70,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  aiButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0FF',
    borderRadius: 8,
    marginRight: 8,
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  singleAvatarContainer: {
    alignItems: 'center',
  },
  singleAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingTitleBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  floatingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  floatingSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  floatingPresence: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  floatingPresenceText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  floatingCustomStatus: {
    fontSize: 13,
    color: '#999',
  },
  highlightedMessageContainer: {
    backgroundColor: '#FFF9C4',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    paddingLeft: 8,
  },
});

