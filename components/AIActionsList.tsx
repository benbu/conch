/**
 * AIActionsList Component
 * Displays AI-extracted action items
 */

import { format } from 'date-fns';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AIActions, ActionItem } from '../types';

interface AIActionsListProps {
  visible: boolean;
  onClose: () => void;
  actions: AIActions | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function AIActionsList({
  visible,
  onClose,
  actions,
  loading,
  error,
  onRefresh,
}: AIActionsListProps) {
  const renderActionItem = (action: ActionItem, index: number) => (
    <View key={index} style={styles.actionItem}>
      <View style={styles.actionHeader}>
        <View style={styles.checkbox}>
          {action.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.actionTitle, action.completed && styles.completedText]}>
          {action.title}
        </Text>
      </View>
      
      {(action.ownerId || action.dueAt) && (
        <View style={styles.actionDetails}>
          {action.ownerId && (
            <Text style={styles.detailText}>👤 {action.ownerId}</Text>
          )}
          {action.dueAt && (
            <Text style={styles.detailText}>
              📅 {format(new Date(action.dueAt), 'MMM d, yyyy')}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Action Items</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Extracting actions...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {actions && !loading && !error && (
              <View style={styles.actionsContainer}>
                {actions.items.length > 0 ? (
                  <>
                    {actions.items.map((action, index) => renderActionItem(action, index))}
                    
                    <View style={styles.metadata}>
                      <Text style={styles.metadataText}>
                        Extracted {format(new Date(actions.createdAt), 'MMM d, yyyy h:mm a')}
                      </Text>
                      <Text style={styles.metadataText}>
                        From {actions.sourceMessageIds.length} messages
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                      <Text style={styles.refreshButtonText}>🔄 Refresh Actions</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No action items found</Text>
                    <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                      <Text style={styles.refreshButtonText}>🔄 Scan Again</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {!actions && !loading && !error && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No actions extracted yet</Text>
                <TouchableOpacity style={styles.generateButton} onPress={onRefresh}>
                  <Text style={styles.generateButtonText}>Extract Actions</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingVertical: 8,
  },
  actionItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  actionDetails: {
    marginTop: 8,
    marginLeft: 36,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  metadata: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  refreshButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  generateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

