import { AIActionsList } from '@/components/AIActionsList';
import { AIDecisionsList } from '@/components/AIDecisionsList';
import { AIFeatureMenu } from '@/components/AIFeatureMenu';
import { AIPriorityBadge } from '@/components/AIPriorityBadge';
import { AISummarySheet } from '@/components/AISummarySheet';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { MessageBubble } from '@/components/MessageBubble';
import { useAIActions } from '@/hooks/useAIActions';
import { useAIDecisions } from '@/hooks/useAIDecisions';
import { useAIPriority } from '@/hooks/useAIPriority';
import { useAISummary } from '@/hooks/useAISummary';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { pickImageFromGallery, uploadConversationImage } from '@/services/imageService';
import { useChatStore } from '@/stores/chatStore';
import { Message } from '@/types';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const conversationId = Array.isArray(params.id) ? params.id?.[0] ?? null : params.id ?? null;
  const [messageText, setMessageText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showDecisions, setShowDecisions] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  
  const { user } = useAuth();
  const { messages, loading, sendMessage, loadMoreMessages } = useMessages(conversationId);
  const conversation = useChatStore((state) =>
    conversationId ? state.conversations.find((c) => c.id === conversationId) : undefined
  );

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

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id;
    const priorityScore = aiPriority.getPriorityScore(item.id);
    
    return (
      <View>
        {priorityScore && priorityScore >= 6 && (
          <AIPriorityBadge 
            score={priorityScore}
            reason={aiPriority.priority?.priorityMessages.find(p => p.messageId === item.id)?.reason}
          />
        )}
        <MessageBubble message={item} isOwn={isOwn} onRetry={handleRetry} />
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

  return (
    <>
      <Stack.Screen
        options={{
          title: conversation?.title || 'Chat',
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
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          inverted={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            loading ? <ActivityIndicator style={styles.loadingMore} /> : null
          }
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.imageButton}
            onPress={handleImagePick}
            disabled={uploading}
          >
            <Text style={styles.imageButtonText}>📷</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            editable={!uploading}
          />
          
          <TouchableOpacity
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
});

