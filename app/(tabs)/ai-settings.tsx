/**
 * AI Settings Screen
 * Manage AI features and permissions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const AI_SETTINGS_KEY = 'ai_settings';

interface AISettings {
  summaryEnabled: boolean;
  actionsEnabled: boolean;
  decisionsEnabled: boolean;
  priorityEnabled: boolean;
  autoCache: boolean;
  cacheExpiry: number; // hours
}

const DEFAULT_SETTINGS: AISettings = {
  summaryEnabled: true,
  actionsEnabled: true,
  decisionsEnabled: true,
  priorityEnabled: true,
  autoCache: true,
  cacheExpiry: 1,
};

export default function AISettingsScreen() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(AI_SETTINGS_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    }
  };

  const saveSettings = async (newSettings: AISettings) => {
    try {
      await AsyncStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const updateSetting = <K extends keyof AISettings>(
    key: K,
    value: AISettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear AI Cache',
      'This will remove all cached AI results. They will be regenerated when requested.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const keys = await AsyncStorage.getAllKeys();
              const aiKeys = keys.filter(key => key.startsWith('ai_'));
              await AsyncStorage.multiRemove(aiKeys);
              Alert.alert('Success', 'AI cache cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'AI Settings',
          headerBackTitle: 'Back',
        }}
      />
      
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          <Text style={styles.sectionDescription}>
            Control which AI features are enabled in conversations
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Thread Summaries</Text>
              <Text style={styles.settingDescription}>
                Generate conversation summaries
              </Text>
            </View>
            <Switch
              value={settings.summaryEnabled}
              onValueChange={(value) => updateSetting('summaryEnabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Action Items</Text>
              <Text style={styles.settingDescription}>
                Extract tasks and action items
              </Text>
            </View>
            <Switch
              value={settings.actionsEnabled}
              onValueChange={(value) => updateSetting('actionsEnabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Decision Tracking</Text>
              <Text style={styles.settingDescription}>
                Track key decisions made
              </Text>
            </View>
            <Switch
              value={settings.decisionsEnabled}
              onValueChange={(value) => updateSetting('decisionsEnabled', value)}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Priority Detection</Text>
              <Text style={styles.settingDescription}>
                Highlight important messages
              </Text>
            </View>
            <Switch
              value={settings.priorityEnabled}
              onValueChange={(value) => updateSetting('priorityEnabled', value)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caching</Text>
          <Text style={styles.sectionDescription}>
            Control how AI results are cached
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-cache Results</Text>
              <Text style={styles.settingDescription}>
                Automatically save AI results for offline access
              </Text>
            </View>
            <Switch
              value={settings.autoCache}
              onValueChange={(value) => updateSetting('autoCache', value)}
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={clearCache}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Clearing...' : '🗑️ Clear AI Cache'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <Text style={styles.sectionDescription}>
            All AI features are user-initiated only. Your conversations are processed
            securely and are never used to train AI models.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How AI Works</Text>
            <Text style={styles.infoText}>
              • All AI processing happens in secure Cloud Functions{'\n'}
              • Results are cached locally on your device{'\n'}
              • You control when AI features are used{'\n'}
              • Data is never shared with third parties{'\n'}
              • Cache is cleared when you log out
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.infoText}>
            Conch Social uses AI to help you stay productive in team conversations.
            AI features are powered by OpenAI's GPT-4 and run securely in Firebase
            Cloud Functions.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

