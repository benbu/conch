/**
 * AISummarySheet Component
 * Displays AI-generated conversation summaries in a bottom sheet
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
import { AISummary } from '../types';

interface AISummarySheetProps {
  visible: boolean;
  onClose: () => void;
  summary: AISummary | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function AISummarySheet({
  visible,
  onClose,
  summary,
  loading,
  error,
  onRefresh,
}: AISummarySheetProps) {
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
            <Text style={styles.title}>Thread Summary</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Generating summary...</Text>
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

            {summary && !loading && !error && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>{summary.text}</Text>
                
                <View style={styles.metadata}>
                  <Text style={styles.metadataText}>
                    Generated {format(new Date(summary.createdAt), 'MMM d, yyyy h:mm a')}
                  </Text>
                  <Text style={styles.metadataText}>
                    Based on {summary.sourceMessageIds.length} messages
                  </Text>
                </View>

                <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                  <Text style={styles.refreshButtonText}>🔄 Refresh Summary</Text>
                </TouchableOpacity>
              </View>
            )}

            {!summary && !loading && !error && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No summary available yet</Text>
                <TouchableOpacity style={styles.generateButton} onPress={onRefresh}>
                  <Text style={styles.generateButtonText}>Generate Summary</Text>
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
  summaryContainer: {
    paddingVertical: 8,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
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

