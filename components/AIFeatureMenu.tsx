/**
 * AIFeatureMenu Component
 * Menu for accessing AI features in a conversation
 */

import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface AIFeatureMenuProps {
  visible: boolean;
  onClose: () => void;
  onSummary: () => void;
  onActions: () => void;
  onDecisions: () => void;
  onPriority: () => void;
}

export function AIFeatureMenu({
  visible,
  onClose,
  onSummary,
  onActions,
  onDecisions,
  onPriority,
}: AIFeatureMenuProps) {
  const menuItems = [
    {
      icon: '📝',
      title: 'Thread Summary',
      description: 'Get a concise summary of this conversation',
      onPress: () => {
        onClose();
        setTimeout(onSummary, 300);
      },
    },
    {
      icon: '✅',
      title: 'Action Items',
      description: 'Extract tasks and action items',
      onPress: () => {
        onClose();
        setTimeout(onActions, 300);
      },
    },
    {
      icon: '💡',
      title: 'Decisions',
      description: 'Track key decisions made',
      onPress: () => {
        onClose();
        setTimeout(onDecisions, 300);
      },
    },
    {
      icon: '⚡',
      title: 'Priority Messages',
      description: 'Identify urgent or important messages',
      onPress: () => {
        onClose();
        setTimeout(onPriority, 300);
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.menu}>
          <View style={styles.header}>
            <Text style={styles.title}>AI Features</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuDescription}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              AI features are user-initiated only
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    maxHeight: 400,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    padding: 12,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

