import { IN_APP_NOTIFICATIONS_ENABLED } from '@/constants/featureFlags';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { getTranslationErrorsForUser } from '@/services/firestoreService';
import { clearFailedMessages, clearQueue, getQueueStats } from '@/services/offlineQueueService';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TranslationErrorItem = Awaited<ReturnType<typeof getTranslationErrorsForUser>>[number];

export default function DeveloperScreen() {
  const headerHeight = useHeaderHeight();
  const router = useRouter();
  const { user } = useAuth();
  const { sendTest } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<TranslationErrorItem[]>([]);
  const [queueStats, setQueueStats] = useState<{ total: number; pending: number; failed: number }>({ total: 0, pending: 0, failed: 0 });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [errs, stats] = await Promise.all([
        getTranslationErrorsForUser(user.id, 50),
        getQueueStats(),
      ]);
      setErrors(errs);
      setQueueStats(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const handleOpenInChat = (item: TranslationErrorItem) => {
    router.push(`/chat/${item.conversationId}?messageId=${item.messageId}`);
  };

  const handleClearFailed = async () => {
    const cleared = await clearFailedMessages();
    Alert.alert('Offline Queue', `Cleared ${cleared} failed message(s).`);
    setQueueStats(await getQueueStats());
  };

  const handleClearAll = async () => {
    await clearQueue();
    Alert.alert('Offline Queue', 'Cleared all queued messages.');
    setQueueStats(await getQueueStats());
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: headerHeight + 12, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      testID="developer-screen"
    >
      <Text style={styles.title}>Developer Tools</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Translation Errors (Your Conversations)</Text>
        {errors.length === 0 ? (
          <Text style={styles.emptyText}>No translation errors found.</Text>
        ) : (
          errors.map((item) => (
            <TouchableOpacity
              key={`${item.conversationId}:${item.messageId}:${item.lang}`}
              style={styles.row}
              onPress={() => handleOpenInChat(item)}
              testID={`open-chat-${item.conversationId}-${item.messageId}`}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Conv {item.conversationId} · {item.lang.toUpperCase()}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={2}>
                  {item.data.error || 'Unknown error'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Queue</Text>
        <View style={styles.rowStatic}>
          <Text style={styles.stat}>Total: {queueStats.total}</Text>
          <Text style={styles.stat}>Pending: {queueStats.pending}</Text>
          <Text style={styles.stat}>Failed: {queueStats.failed}</Text>
        </View>
        <TouchableOpacity style={styles.menuItem} onPress={handleClearFailed} testID="clear-failed">
          <Text style={styles.menuItemText}>Clear Failed</Text>
          <Text style={styles.menuItemChevron}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleClearAll} testID="clear-all">
          <Text style={styles.menuItemText}>Clear All</Text>
          <Text style={styles.menuItemChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {IN_APP_NOTIFICATIONS_ENABLED && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => sendTest('Dev User', 'This is a test notification', 'dev-test')}
            testID="send-test-notification"
          >
            <Text style={styles.menuItemText}>Send Test In-App Notification</Text>
            <Text style={styles.menuItemChevron}>›</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowTitle: {
    fontSize: 16,
    color: '#000',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chevron: {
    fontSize: 24,
    color: '#666',
  },
  stat: {
    fontSize: 14,
    color: '#000',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
  },
  menuItemChevron: {
    fontSize: 24,
    color: '#666',
  },
});


