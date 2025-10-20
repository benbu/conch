/**
 * AIDecisionsList Component
 * Displays AI-tracked decisions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { format } from 'date-fns';
import { AIDecision } from '../types';

interface AIDecisionsListProps {
  visible: boolean;
  onClose: () => void;
  decisions: AIDecision[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function AIDecisionsList({
  visible,
  onClose,
  decisions,
  loading,
  error,
  onRefresh,
}: AIDecisionsListProps) {
  const renderDecision = (decision: AIDecision, index: number) => (
    <View key={decision.id} style={styles.decisionItem}>
      <View style={styles.decisionNumber}>
        <Text style={styles.decisionNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.decisionContent}>
        <Text style={styles.decisionStatement}>{decision.statement}</Text>
        <Text style={styles.decisionDate}>
          {format(new Date(decision.createdAt), 'MMM d, yyyy h:mm a')}
        </Text>
      </View>
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
            <Text style={styles.title}>Decisions</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Tracking decisions...</Text>
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

            {decisions.length > 0 && !loading && !error && (
              <View style={styles.decisionsContainer}>
                {decisions.map((decision, index) => renderDecision(decision, index))}
                
                <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                  <Text style={styles.refreshButtonText}>🔄 Refresh Decisions</Text>
                </TouchableOpacity>
              </View>
            )}

            {decisions.length === 0 && !loading && !error && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No decisions tracked yet</Text>
                <TouchableOpacity style={styles.generateButton} onPress={onRefresh}>
                  <Text style={styles.generateButtonText}>Track Decisions</Text>
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
  decisionsContainer: {
    paddingVertical: 8,
  },
  decisionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  decisionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  decisionNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  decisionContent: {
    flex: 1,
  },
  decisionStatement: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  decisionDate: {
    fontSize: 14,
    color: '#666',
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

