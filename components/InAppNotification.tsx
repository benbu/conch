/**
 * InAppNotification Component
 * Displays a notification banner at the top of the screen when messages arrive
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NOTIFICATION_HEIGHT = 80;
const AUTO_DISMISS_DELAY = 4000; // 4 seconds
const SWIPE_THRESHOLD = 50; // Distance to swipe before dismissing

interface InAppNotificationProps {
  visible: boolean;
  title: string;
  message: string;
  conversationId: string;
  onPress: () => void;
  onDismiss: () => void;
}

export function InAppNotification({
  visible,
  title,
  message,
  conversationId,
  onPress,
  onDismiss,
}: InAppNotificationProps) {
  const slideAnim = useRef(new Animated.Value(-NOTIFICATION_HEIGHT)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pan responder for swipe-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical swipes
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow upward swipes (negative dy)
        if (gestureState.dy < 0) {
          swipeAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -SWIPE_THRESHOLD) {
          // Swiped up enough to dismiss
          handleDismiss();
        } else {
          // Snap back
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Reset swipe position
      swipeAnim.setValue(0);
      
      // Slide down animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();

      // Auto-dismiss after delay
      dismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, AUTO_DISMISS_DELAY);
    } else {
      // Slide up animation
      Animated.spring(slideAnim, {
        toValue: -NOTIFICATION_HEIGHT,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();

      // Clear timer if notification is dismissed early
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [visible, slideAnim, swipeAnim]);

  const handleDismiss = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    onDismiss();
  };

  const handlePress = () => {
    handleDismiss();
    onPress();
  };

  if (!visible && slideAnim.__getValue() === -NOTIFICATION_HEIGHT) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { translateY: swipeAnim }
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable
        style={styles.notificationContent}
        onPress={handlePress}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
      >
        {/* Swipe indicator */}
        <View style={styles.swipeIndicator} />

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble" size={24} color="#fff" />
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        {/* Close button */}
        <Pressable
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingHorizontal: 12,
  },
  notificationContent: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    minHeight: 70,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  swipeIndicator: {
    position: 'absolute',
    top: 6,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

