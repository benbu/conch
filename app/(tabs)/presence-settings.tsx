import PresenceIndicator from '@/components/PresenceIndicator';
import { useAuth } from '@/hooks/useAuth';
import { useUpdatePresence } from '@/hooks/usePresence';
import { startPresenceTracking } from '@/services/presenceService';
import { selectCustomStatus, useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const STATUS_PRESETS = [
  '📅 In a meeting',
  '🏖️ On vacation',
  '💼 Busy',
  '☕ On a break',
  '🎯 Focusing',
  '🏠 Working from home',
  '🚀 Launching something',
  '🤝 Available for chat',
];

export default function PresenceSettingsScreen() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const { setAppearOffline, updateCustomStatus, updating } = useUpdatePresence();
  const customStatus = useAuthStore(selectCustomStatus);
  const setCustomStatusStore = useAuthStore((state) => state.setCustomStatus);

  const [appearOffline, setAppearOfflineState] = useState(user?.appearOffline || false);
  const [statusInput, setStatusInput] = useState(customStatus || '');
  const [savingAppearOffline, setSavingAppearOffline] = useState(false);

  const handleToggleAppearOffline = async (value: boolean) => {
    if (!user) return;

    try {
      setSavingAppearOffline(true);
      setAppearOfflineState(value);

      // Update Firestore user document
      await setAppearOffline(user.id, value);

      // Update local state
      await updateProfile({ appearOffline: value });

      // Restart presence tracking with new setting
      await startPresenceTracking(user.id, value);

      Alert.alert(
        'Success',
        value ? 'You now appear offline to others' : 'Your online status is now visible'
      );
    } catch (error: any) {
      setAppearOfflineState(!value);
      Alert.alert('Error', error.message || 'Failed to update appear offline setting');
    } finally {
      setSavingAppearOffline(false);
    }
  };

  const handleSaveCustomStatus = async () => {
    if (!user) return;

    try {
      const trimmedStatus = statusInput.trim();
      await updateCustomStatus(user.id, trimmedStatus || undefined);
      setCustomStatusStore(trimmedStatus || undefined);
      Alert.alert('Success', 'Custom status updated');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update custom status');
    }
  };

  const handleClearStatus = async () => {
    if (!user) return;

    try {
      setStatusInput('');
      await updateCustomStatus(user.id, undefined);
      setCustomStatusStore(undefined);
      Alert.alert('Success', 'Custom status cleared');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to clear custom status');
    }
  };

  const handlePresetSelect = (preset: string) => {
    setStatusInput(preset);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Presence Settings</Text>
      </View>

      {/* Current Status Preview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Current Status</Text>
        <View style={styles.statusPreview}>
          <PresenceIndicator userId={user.id} user={user} size="large" showStatus />
          <View style={styles.statusPreviewText}>
            <Text style={styles.statusPreviewLabel}>
              {appearOffline ? 'Offline' : 'Online'}
            </Text>
            {statusInput && <Text style={styles.statusPreviewCustom}>{statusInput}</Text>}
          </View>
        </View>
      </View>

      {/* Appear Offline Toggle */}
      <View style={styles.section}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Appear Offline</Text>
            <Text style={styles.settingDescription}>
              Hide your online status from others. You'll appear offline even when using the app.
            </Text>
          </View>
          {savingAppearOffline ? (
            <ActivityIndicator />
          ) : (
            <Switch
              value={appearOffline}
              onValueChange={handleToggleAppearOffline}
              trackColor={{ false: '#ccc', true: '#34C759' }}
              thumbColor="#fff"
            />
          )}
        </View>
      </View>

      {/* Custom Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Status Message</Text>
        <Text style={styles.sectionDescription}>
          Let others know what you're up to (max 100 characters)
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g., In a meeting, back at 2pm"
          value={statusInput}
          onChangeText={setStatusInput}
          maxLength={100}
          multiline
        />

        <Text style={styles.characterCount}>{statusInput.length}/100</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleClearStatus}
            disabled={updating}
          >
            <Text style={styles.buttonSecondaryText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSaveCustomStatus}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Save Status</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Presets */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Status Presets</Text>
        <View style={styles.presetsGrid}>
          {STATUS_PRESETS.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={styles.presetChip}
              onPress={() => handlePresetSelect(preset)}
            >
              <Text style={styles.presetChipText}>{preset}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ About Presence</Text>
        <Text style={styles.infoText}>
          • <Text style={styles.infoBold}>Online:</Text> You're actively using the app
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.infoBold}>Away:</Text> App is open but inactive for 5+ minutes
        </Text>
        <Text style={styles.infoText}>
          • <Text style={styles.infoBold}>Offline:</Text> App is closed or you've set "Appear
          Offline"
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  statusPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  statusPreviewText: {
    marginLeft: 12,
    flex: 1,
  },
  statusPreviewLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  statusPreviewCustom: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    minHeight: 60,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  buttonSecondaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  presetChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  presetChipText: {
    fontSize: 14,
    color: '#000',
  },
  infoSection: {
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 24,
  },
  infoBold: {
    fontWeight: '600',
    color: '#000',
  },
});

