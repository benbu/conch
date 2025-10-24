/**
 * AISummarySheet Component
 * Displays AI-generated conversation summaries in a bottom sheet
 */

import { format } from 'date-fns';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Summary } from '../types';

interface AISummarySheetProps {
  visible: boolean;
  onClose: () => void;
  summary: Summary | null;
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
                <Markdown
                  style={markdownStyles}
                  onLinkPress={(url: string) => {
                    try { Linking.openURL(url); } catch {}
                    return true;
                  }}
                >
                  {summary.text}
                </Markdown>

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

// Markdown theme styles to match app typography
const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
  },
  heading1: { fontSize: 22, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  heading2: { fontSize: 20, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  heading3: { fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 8 },
  paragraph: { marginTop: 6, marginBottom: 6 },
  bullet_list: { marginTop: 6, marginBottom: 6 },
  ordered_list: { marginTop: 6, marginBottom: 6 },
  list_item: { marginVertical: 2 },
  code_inline: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) as any,
  },
  code_block: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) as any,
  },
  link: { color: '#007AFF' },
  strong: { fontWeight: '700' },
  em: { fontStyle: 'italic' },
} as const;

