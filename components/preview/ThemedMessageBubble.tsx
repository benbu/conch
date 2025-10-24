import { ChatUITokens, LayoutVariant, SizeVariant } from '@/themes/previewThemes';
import { Message } from '@/types';
import { StyleSheet, Text, View } from 'react-native';

interface ThemedMessageBubbleProps {
  tokens: ChatUITokens;
  message: Message;
  isOwn: boolean;
  size: SizeVariant;
  layout: LayoutVariant;
  timestampText?: string;
  conversationType?: 'direct' | 'group';
  translationText?: string | null;
}

export function ThemedMessageBubble({ tokens, message, isOwn, size, layout, timestampText, conversationType, translationText }: ThemedMessageBubbleProps) {
  const bubbleMaxWidth = size === 'compact' ? '68%' : size === 'cozy' ? '75%' : '82%';
  const bubblePaddingV = size === 'compact' ? 6 : size === 'cozy' ? 8 : 10;
  const bubblePaddingH = size === 'compact' ? 10 : size === 'cozy' ? 12 : 14;

  const containerStyle = [
    styles.row,
    layout === 'centered' ? styles.centeredRow : undefined,
  ];

  const bubbleStyle = [
    {
      maxWidth: bubbleMaxWidth,
      paddingVertical: bubblePaddingV,
      paddingHorizontal: bubblePaddingH,
      borderRadius: tokens.bubbleRadius,
      backgroundColor: isOwn ? tokens.bubbleOwnBg : tokens.bubbleOtherBg,
      alignSelf: layout === 'centered' ? 'center' : isOwn ? 'flex-end' : 'flex-start',
    },
    tokens.bubbleShadow && {
      shadowColor: tokens.bubbleShadow.color,
      shadowOpacity: tokens.bubbleShadow.opacity,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  ];

  const textStyle = {
    color: isOwn ? tokens.bubbleOwnText : tokens.bubbleOtherText,
    fontSize: size === 'compact' ? 14 : size === 'cozy' ? 15 : 16,
  } as const;

  const renderInlineStatus = () => {
    if (!isOwn) return null;
    // Group chats show minimal status
    if (conversationType === 'group') {
      switch (message.deliveryStatus) {
        case 'sending':
          return <Text style={[styles.inlineStatus, { color: tokens.bubbleOwnText }]}>⏱️</Text>;
        case 'failed':
          return <Text style={[styles.inlineStatus, { color: '#FF3B30' }]}>⚠️</Text>;
        default:
          return <Text style={[styles.inlineStatus, { color: tokens.bubbleOwnText }]}>✓</Text>;
      }
    }
    switch (message.deliveryStatus) {
      case 'sending':
        return <Text style={[styles.inlineStatus, { color: isOwn ? tokens.bubbleOwnText : '#999' }]}>⏱️</Text>;
      case 'sent':
        return <Text style={[styles.inlineStatus, { color: isOwn ? tokens.bubbleOwnText : '#999' }]}>✓</Text>;
      case 'delivered':
        return <Text style={[styles.inlineStatus, { color: isOwn ? tokens.bubbleOwnText : '#999' }]}>✓✓</Text>;
      case 'read':
        return <Text style={[styles.inlineStatus, { color: '#4CAF50' }]}>✓✓</Text>;
      case 'failed':
        return <Text style={[styles.inlineStatus, { color: '#FF3B30' }]}>⚠️</Text>;
      default:
        return null;
    }
  };

  return (
    <View style={containerStyle}>
      <View style={bubbleStyle}>
        {!!message.text && (
          <Text style={textStyle}>
            {message.text}
            {renderInlineStatus()}
          </Text>
        )}
        {!!translationText && (
          <View style={[styles.translationBubble, { backgroundColor: isOwn ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }]}> 
            <Text style={{ fontSize: 13, color: isOwn ? tokens.bubbleOwnText : '#1a1a1a' }}>{translationText}</Text>
          </View>
        )}
        {!!timestampText && (
          <Text style={[styles.timestamp, { color: isOwn ? tokens.bubbleOwnText : '#999' }]}>
            {timestampText}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    marginBottom: 6,
  },
  centeredRow: {
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    opacity: 0.7,
  },
  inlineStatus: {
    fontSize: 11,
    marginLeft: 6,
  },
  translationBubble: {
    marginTop: 6,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
});


