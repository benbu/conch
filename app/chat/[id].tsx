import { AIActionsList } from '@/components/AIActionsList';
import { AIDecisionsList } from '@/components/AIDecisionsList';
import { AIFeatureMenu } from '@/components/AIFeatureMenu';
import { AIPriorityBadge } from '@/components/AIPriorityBadge';
import { AISummarySheet } from '@/components/AISummarySheet';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import GroupNameModal from '@/components/GroupNameModal';
import MemberManagementModal from '@/components/MemberManagementModal';
import { MessageBubble } from '@/components/MessageBubble';
import { ChatHeaderAvatars } from '@/components/chat/ChatHeaderAvatars';
import { FloatingTitleBar as FloatingTitleBarComp } from '@/components/chat/FloatingTitleBar';
import { InputBar as InputBarComp } from '@/components/chat/InputBar';
import { MessageList as MessageListComp } from '@/components/chat/MessageList';
import { GLASS_INTENSITY, getGlassTint } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAIActions } from '@/hooks/useAIActions';
import { useAIDecisions } from '@/hooks/useAIDecisions';
import { useAIPriority } from '@/hooks/useAIPriority';
import { useAISummary } from '@/hooks/useAISummary';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useUserPresence } from '@/hooks/usePresence';
import { useViewableReadReceipts } from '@/hooks/useViewableReadReceipts';
import { pickImageFromGallery, uploadConversationImage } from '@/services/imageService';
import { setCurrentConversation } from '@/services/messageNotificationService';
import { useChatStore } from '@/stores/chatStore';
import { Message, User } from '@/types';
import { useHeaderHeight } from '@react-navigation/elements';
import { format } from 'date-fns';
import { BlurView } from 'expo-blur';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const headerHeight = useHeaderHeight();
  const [inputBarHeight, setInputBarHeight] = React.useState(0);
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
  const [didScrollToUnread, setDidScrollToUnread] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const flatListRef = React.useRef<FlatList>(null);
  const router = useRouter();
  const { user } = useAuth();
  const conversation = useChatStore((state) =>
    conversationId ? state.conversations.find((c) => c.id === conversationId) : undefined
  );
  // Read receipts on viewability
  const { onViewableItemsChanged, viewabilityConfig } = useViewableReadReceipts(
    conversationId,
    user?.id,
    conversation?.type
  );
  const { messages, loading, loadingMore, hasMore, sendMessage, loadMoreMessages } = useMessages(conversationId);
  const { updateGroupName, addGroupMember, updateMemberRole, leaveGroup, removeMember } = useConversations();

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
    // Set current conversation in both chat store and notification service
    useChatStore.getState().setCurrentConversation(conversationId);
    setCurrentConversation(conversationId);
    
    return () => {
      useChatStore.getState().setCurrentConversation(null);
      setCurrentConversation(null);
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

  // On open, scroll so the oldest unread message is at the top; if none, go to bottom
  useEffect(() => {
    if (!conversationId || targetMessageId || loading || didScrollToUnread) return;
    if (!user || messages.length === 0) return;

    let cancelled = false;
    const tryScroll = async () => {
      // Attempt up to 10 pagination steps to find the oldest unread
      for (let i = 0; i < 10; i++) {
        const currentMessages = useChatStore.getState().getMessagesByConversationId(conversationId);
        let idx = -1;
        if (conversation?.type === 'direct') {
          idx = currentMessages.findIndex(
            (m) => m.senderId !== user.id && m.deliveryStatus !== 'read'
          );
        }
        // Groups: skip scroll-to-unread based on read receipts
        if (idx !== -1) {
          // Align the oldest unread to the top of the view
          setTimeout(() => {
            if (cancelled) return;
            flatListRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0 });
            setDidScrollToUnread(true);
          }, 250);
          return;
        }
        if (!hasMore) break;
        const loaded = await loadMoreMessages();
        if (loaded === 0) break;
      }

      // No unread found; scroll to bottom (latest)
      setTimeout(() => {
        if (cancelled) return;
        flatListRef.current?.scrollToEnd?.({ animated: false });
        setDidScrollToUnread(true);
      }, 250);
    };

    tryScroll();
    return () => {
      cancelled = true;
    };
  }, [conversationId, targetMessageId, loading, messages, hasMore, user?.id, didScrollToUnread]);

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

  // Track keyboard visibility to adjust bottom spacer
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent as any, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent as any, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id;
    const priorityScore = aiPriority.getPriorityScore(item.id);
    const isHighlighted = item.id === highlightedMessageId;
    
    // Determine if we should show avatar for this message
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showAvatar = !isOwn && (!previousMessage || previousMessage.senderId !== item.senderId);
    const isStartOfSenderBlock = !previousMessage || previousMessage.senderId !== item.senderId;
    // Ensure the Avatar receives a full user object; fall back to participants by senderId
    const senderUser = item.sender ?? (participants as any[]).find((p: any) => p.id === item.senderId);
    const enrichedMessage = senderUser ? { ...item, sender: senderUser } : item;
    // Metadata flags
    const showSenderAbove = conversation?.type === 'group' && !isOwn && isStartOfSenderBlock;
    const toDate = (v: any): Date | null => {
      if (v instanceof Date) return v;
      if (typeof v === 'number') return new Date(v);
      if (typeof v === 'string') {
        const t = Date.parse(v);
        return isNaN(t) ? null : new Date(t);
      }
      if (v && typeof v === 'object' && typeof v.toDate === 'function') {
        try { return v.toDate(); } catch {}
      }
      return null;
    };
    const createdAt = toDate(item.createdAt);
    const prevCreatedAt = previousMessage ? toDate(previousMessage.createdAt) : null;
    const showTimestampBelow = prevCreatedAt && createdAt
      ? (createdAt.getTime() - prevCreatedAt.getTime()) >= 5 * 60 * 1000
      : true;
    const timestampText = createdAt && showTimestampBelow ? format(createdAt, 'HH:mm') : undefined;
    
    return (
      <View style={isHighlighted ? styles.highlightedMessageContainer : undefined}>
        {priorityScore && priorityScore >= 6 && (
          <AIPriorityBadge 
            score={priorityScore}
            reason={aiPriority.priority?.priorityMessages.find((p: any) => p.messageId === item.id)?.reason}
          />
        )}
        <MessageBubble 
          message={enrichedMessage} 
          isOwn={isOwn} 
          showAvatar={showAvatar}
          showSenderAbove={showSenderAbove}
          showTimestampBelow={showTimestampBelow}
          timestampText={timestampText}
          conversationType={conversation?.type}
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
  const HeaderTitle = () => (
    <ChatHeaderAvatars
      type={conversation?.type}
      participants={participants}
      otherUser={otherUser}
      onPressGroup={() => setShowMemberManagement(true)}
    />
  );

  // Floating title bar component
  const FloatingTitleBar = () => (
    <FloatingTitleBarComp
      type={conversation?.type}
      conversation={conversation}
      participantsCount={participants.length}
      currentUserRole={currentUserRole}
      onEditGroup={() => setShowGroupNameModal(true)}
      otherUser={otherUser}
      presence={presence}
    />
  );

  return (
    <>
      <Stack.Screen
        options={{
          animation: 'fade',
          freezeOnBlur: true,
          headerTransparent: true,
          contentStyle: { backgroundColor: 'transparent' },
          headerBackground: () => (
            <BlurView
              tint={getGlassTint(colorScheme === 'dark')}
              intensity={GLASS_INTENSITY}
              style={StyleSheet.absoluteFill}
            />
          ),
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
        keyboardVerticalOffset={headerHeight}
      >
        <FloatingTitleBar />
        <MessageListComp
          flatListRef={flatListRef}
          messages={messages}
          renderItem={renderMessage}
          onScroll={onScroll}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          loadingMore={loadingMore}
          headerSpacerHeight={headerHeight}
          footerSpacerHeight={keyboardVisible ? 0 : inputBarHeight}
        />

        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h && Math.abs(h - inputBarHeight) > 1) setInputBarHeight(h);
          }}
        >
          <InputBarComp
            uploading={uploading}
            onPickImage={handleImagePick}
            messageText={messageText}
            setMessageText={setMessageText}
            onSend={handleSend}
          />
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
    backgroundColor: 'transparent',
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

