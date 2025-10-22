// Message bubble component with status indicators
import { format } from 'date-fns';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Message } from '../types';
import Avatar from './Avatar';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onImagePress?: (imageUrl: string) => void;
  onRetry?: (messageId: string) => void;
}

export function MessageBubble({ message, isOwn, showAvatar, onImagePress, onRetry }: MessageBubbleProps) {
  const renderStatusIcon = () => {
    switch (message.deliveryStatus) {
      case 'sending':
        return <Text style={styles.statusIcon}>⏱️</Text>;
      case 'sent':
        return <Text style={styles.statusIcon}>✓</Text>;
      case 'delivered':
        return <Text style={styles.statusIcon}>✓✓</Text>;
      case 'read':
        return <Text style={[styles.statusIcon, styles.readStatus]}>✓✓</Text>;
      case 'failed':
        return (
          <TouchableOpacity onPress={() => onRetry?.(message.id)}>
            <Text style={[styles.statusIcon, styles.failedStatus]}>⚠️</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  // initials handled by Avatar fallback

  const messageContent = (
    <View
      style={[
        styles.messageBubble,
        isOwn ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {!isOwn && message.sender && (
        <Text style={styles.senderName}>
          {message.sender.displayName}
        </Text>
      )}

      {/* Image attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          {message.attachments
            .filter(att => att.type === 'image')
            .map((attachment, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => onImagePress?.(attachment.url)}
              >
                <Image
                  source={{ uri: attachment.thumbnailUrl || attachment.url }}
                  style={styles.attachmentImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
        </View>
      )}

      {/* Message text */}
      <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
        {message.text}
      </Text>

      {/* Timestamp and status */}
      <View style={styles.footer}>
        <Text style={[styles.timestamp, isOwn && styles.ownTimestamp]}>
          {format(message.createdAt, 'HH:mm')}
        </Text>
        {isOwn && renderStatusIcon()}
      </View>

      {/* Retry hint for failed messages */}
      {message.deliveryStatus === 'failed' && (
        <Text style={styles.failedHint}>Tap ⚠️ to retry</Text>
      )}
    </View>
  );

  // For own messages or when no avatar should be shown
  if (isOwn) {
    return messageContent;
  }

  // For other users' messages with avatar layout
  return (
    <View style={styles.messageRow}>
      {/* Avatar or spacer */}
      <View style={styles.avatarContainer}>
        {showAvatar ? (
          <Avatar user={message.sender} size={40} />
        ) : (
          <View style={styles.avatarSpacer} />
        )}
      </View>
      {messageContent}
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarSpacer: {
    width: 40,
    height: 40,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 0,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    marginBottom: 8,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9E9EB',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  attachmentsContainer: {
    marginBottom: 8,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  ownMessageText: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  ownTimestamp: {
    color: '#fff',
    opacity: 0.7,
  },
  statusIcon: {
    fontSize: 11,
    color: '#fff',
    opacity: 0.7,
  },
  readStatus: {
    color: '#4CAF50',
    opacity: 1,
  },
  failedStatus: {
    color: '#FF3B30',
    opacity: 1,
  },
  failedHint: {
    fontSize: 10,
    color: '#FF3B30',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

