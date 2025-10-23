// Message bubble component with status indicators
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Message } from '../types';
import Avatar from './Avatar';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onImagePress?: (imageUrl: string) => void;
  onRetry?: (messageId: string) => void;
  showSenderAbove?: boolean;
  showTimestampBelow?: boolean;
  timestampText?: string;
  conversationType?: 'direct' | 'group';
  belowContent?: React.ReactNode;
}

export function MessageBubble({ message, isOwn, showAvatar, onImagePress, onRetry, showSenderAbove, showTimestampBelow, timestampText, conversationType, belowContent }: MessageBubbleProps) {
  const renderStatusIcon = () => {
    // In group chats, only show minimal status for own messages
    if (conversationType === 'group') {
      if (!isOwn) return null;
      if (message.deliveryStatus === 'sending') return <Text style={styles.statusIcon}>⏱️</Text>;
      if (message.deliveryStatus === 'failed') {
        return (
          <TouchableOpacity onPress={() => onRetry?.(message.id)}>
            <Text style={[styles.statusIcon, styles.failedStatus]}>⚠️</Text>
          </TouchableOpacity>
        );
      }
      // Treat any other states as sent for UI simplicity
      return <Text style={styles.statusIcon}>✓</Text>;
    }

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

  const renderInlineStatusSpan = () => {
    if (!isOwn) return null;
    if (conversationType === 'group') {
      if (message.deliveryStatus === 'sending') return <Text style={styles.statusIconInline}>⏱️</Text>;
      if (message.deliveryStatus === 'failed') return <Text style={[styles.statusIconInline, styles.failedStatus]}>⚠️</Text>;
      return <Text style={styles.statusIconInline}>✓</Text>;
    }

    switch (message.deliveryStatus) {
      case 'sending':
        return <Text style={styles.statusIconInline}>⏱️</Text>;
      case 'sent':
        return <Text style={styles.statusIconInline}>✓</Text>;
      case 'delivered':
        return <Text style={styles.statusIconInline}>✓✓</Text>;
      case 'read':
        return <Text style={[styles.statusIconInline, styles.readStatus]}>✓✓</Text>;
      case 'failed':
        return (
          <Text
            style={[styles.statusIconInline, styles.failedStatus]}
            onPress={() => onRetry?.(message.id)}
          >
            ⚠️
          </Text>
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

      {/* Message text with inline status for own messages */}
      <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
        {message.text}
        {renderInlineStatusSpan()}
      </Text>

      {/* Inline AI translation placeholder - rendered by parent via children or separate component */}

      {/* Retry hint for failed messages */}
      {message.deliveryStatus === 'failed' && (
        <Text style={styles.failedHint}>Tap ⚠️ to retry</Text>
      )}
    </View>
  );

  // For own messages or when no avatar should be shown
  if (isOwn) {
    return (
      <View style={styles.fullWidthContainer}>
        {messageContent}
        {belowContent}
        {showTimestampBelow && !!timestampText && (
          <Text style={[styles.metaBelow, styles.metaCenter]}>{timestampText}</Text>
        )}
      </View>
    );
  }

  // For other users' messages in direct (single) chats: no avatar column, no left gap
  if (conversationType !== 'group' && !showAvatar) {
    return (
      <View style={styles.fullWidthContainer}>
        {messageContent}
        {belowContent}
        {showTimestampBelow && !!timestampText && (
          <Text style={[styles.metaBelow, styles.metaCenter]}>{timestampText}</Text>
        )}
      </View>
    );
  }

  // For other users' messages with avatar layout
  return (
    <View style={[styles.messageRow, showAvatar ? styles.newOtherSenderTopGap : undefined]}>
      {/* Avatar or spacer */}
      <View style={styles.avatarContainer}>
        {showAvatar ? (
          <Avatar user={message.sender} size={40} />
        ) : (
          <View style={styles.avatarSpacer} />
        )}
      </View>
      <View style={styles.messageColumn}>
        {/* Sender name above bubble (group chats) */}
        {showSenderAbove && message.sender?.displayName ? (
          <Text style={styles.metaAbove}>{message.sender.displayName}</Text>
        ) : null}
        {messageContent}
        {belowContent}
        {showTimestampBelow && !!timestampText && (
          <Text style={[styles.metaBelow, styles.metaCenter]}>{timestampText}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
    width: '100%',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    marginRight: 8,
    alignSelf: 'flex-start',
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
  fullWidthContainer: {
    width: '100%',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 0,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    marginBottom: 6,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E9E9EB',
  },
  senderName: {
    fontSize: 12,
    color: '#000',
    marginBottom: 4,
    fontWeight: '600',
  },
  attachmentsContainer: {
    marginBottom: 6,
  },
  attachmentImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 3,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
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
  statusIconInline: {
    fontSize: 11,
    color: '#bbb',
    opacity: 0.9,
    marginLeft: 6,
    position: 'relative',
    top: 5, // slight downward shift visually without affecting line height
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
  messageColumn: {
    flex: 1,
  },
  newOtherSenderTopGap: {
    marginTop: 8,
  },
  // Metadata outside the bubble
  metaAbove: {
    fontSize: 12,
    color: '#000',
    marginBottom: 2,
    fontWeight: '600',
  },
  metaBelow: {
    fontSize: 11,
    color: '#000',
    marginTop: 2,
  },
  metaCenter: {
    alignSelf: 'center',
  },
});

