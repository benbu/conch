/**
 * AI Settings Screen
 * Manage AI features and permissions
 */

import { useAuth } from '@/hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState<boolean>(!!user?.autoTranslate);
  const [defaultLanguage, setDefaultLanguage] = useState<string>((user as any)?.defaultLanguage || 'en');
  const [preferredAIModel, setPreferredAIModel] = useState<string>((user as any)?.preferredAIModel || 'gpt-4o-mini');
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [langQuery, setLangQuery] = useState('');
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [modelQuery, setModelQuery] = useState('');
  useEffect(() => {
    setAutoTranslate(!!user?.autoTranslate);
    setDefaultLanguage((user as any)?.defaultLanguage || 'en');
    setPreferredAIModel((user as any)?.preferredAIModel || 'gpt-4o-mini');
  }, [user?.autoTranslate, (user as any)?.defaultLanguage, (user as any)?.preferredAIModel]);
  const languageOptions = useMemo(
    () => [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'it', name: 'Italian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ko', name: 'Korean' },
      { code: 'ru', name: 'Russian' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'nl', name: 'Dutch' },
      { code: 'sv', name: 'Swedish' },
      { code: 'no', name: 'Norwegian' },
      { code: 'da', name: 'Danish' },
      { code: 'fi', name: 'Finnish' },
      { code: 'pl', name: 'Polish' },
      { code: 'cs', name: 'Czech' },
      { code: 'tr', name: 'Turkish' },
      { code: 'el', name: 'Greek' },
      { code: 'he', name: 'Hebrew' },
      { code: 'th', name: 'Thai' },
      { code: 'vi', name: 'Vietnamese' },
      { code: 'id', name: 'Indonesian' },
      { code: 'ms', name: 'Malay' },
      { code: 'ro', name: 'Romanian' },
      { code: 'hu', name: 'Hungarian' },
      { code: 'uk', name: 'Ukrainian' },
    ],
    []
  );

  const aiModelOptions = useMemo(
    () => [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Balanced performance and cost' },
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High performance' },
    ],
    []
  );
  const filteredLanguages = useMemo(() => {
    const q = langQuery.trim().toLowerCase();
    if (!q) return languageOptions;
    return languageOptions.filter(
      (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  }, [langQuery, languageOptions]);

  const filteredModels = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    if (!q) return aiModelOptions;
    return aiModelOptions.filter(
      (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    );
  }, [modelQuery, aiModelOptions]);

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

  const onToggleAutoTranslate = async (value: boolean) => {
    setAutoTranslate(value);
    try {
      if (value) {
        const hasExistingLang = !!(user as any)?.defaultLanguage;
        // Derive device locale language (e.g., en-US -> en)
        const deviceLocale = (Intl?.DateTimeFormat?.().resolvedOptions?.().locale as string) || 'en';
        const deviceLang = (deviceLocale.split('-')[0] || 'en').toLowerCase();
        const supportedCodes = languageOptions.map(l => l.code);
        const chosenLang = hasExistingLang
          ? ((user as any)?.defaultLanguage as string)
          : (supportedCodes.includes(deviceLang) ? deviceLang : 'en');

        if (!hasExistingLang) {
          setDefaultLanguage(chosenLang);
          await updateProfile({ autoTranslate: true, defaultLanguage: chosenLang });
        } else {
          await updateProfile({ autoTranslate: true });
        }
      } else {
        await updateProfile({ autoTranslate: false });
      }
    } catch (e) {
      setAutoTranslate(!value);
      Alert.alert('Error', 'Failed to update auto-translate');
    }
  };

  const onSelectLanguage = async (lang: string) => {
    const prev = defaultLanguage;
    setDefaultLanguage(lang);
    try {
      await updateProfile({ defaultLanguage: lang });
      setLangModalVisible(false);
    } catch (e) {
      setDefaultLanguage(prev);
      Alert.alert('Error', 'Failed to update language');
    }
  };

  const onSelectAIModel = async (model: string) => {
    const prev = preferredAIModel;
    setPreferredAIModel(model);
    try {
      await updateProfile({ preferredAIModel: model });
      setModelModalVisible(false);
    } catch (e) {
      setPreferredAIModel(prev);
      Alert.alert('Error', 'Failed to update AI model preference');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackTitle: '',
          title: 'AI Settings',
        }}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: tabBarHeight }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Translation</Text>
          <Text style={styles.sectionDescription}>
            Automatically translate incoming messages into your preferred language
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Auto-translate</Text>
              <Text style={styles.settingDescription}>Show translations inline under messages</Text>
            </View>
            <Switch
              value={autoTranslate}
              onValueChange={onToggleAutoTranslate}
            />
          </View>

          <View style={[styles.settingRow, { alignItems: 'center' } ]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Default language</Text>
              <Text style={styles.settingDescription}>Select the language to translate into</Text>
            </View>
            <TouchableOpacity
              disabled={!autoTranslate}
              onPress={() => setLangModalVisible(true)}
              style={[styles.dropdownButton, !autoTranslate ? styles.langPillDisabled : undefined]}
            >
              <Text style={styles.dropdownButtonText}>
                {languageOptions.find((l) => l.code === defaultLanguage)?.name || defaultLanguage.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={langModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setLangModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Choose language</Text>
                <TextInput
                  placeholder="Search language or code"
                  placeholderTextColor="#999"
                  value={langQuery}
                  onChangeText={setLangQuery}
                  style={styles.searchInput}
                />
                <ScrollView style={{ maxHeight: 360 }}>
                  {filteredLanguages.map((l) => (
                    <TouchableOpacity
                      key={l.code}
                      style={styles.optionRow}
                      onPress={() => onSelectLanguage(l.code)}
                    >
                      <Text style={styles.optionText}>{l.name}</Text>
                      <Text style={styles.optionCode}>{l.code.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ height: 12 }} />
                <TouchableOpacity onPress={() => setLangModalVisible(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={modelModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setModelModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Choose AI Model</Text>
                <TextInput
                  placeholder="Search model or description"
                  placeholderTextColor="#999"
                  value={modelQuery}
                  onChangeText={setModelQuery}
                  style={styles.searchInput}
                />
                <ScrollView style={{ maxHeight: 360 }}>
                  {filteredModels.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.optionRow}
                      onPress={() => onSelectAIModel(m.id)}
                    >
                      <Text style={styles.optionText}>{m.name}</Text>
                      <Text style={styles.optionCode}>{m.description}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ height: 12 }} />
                <TouchableOpacity onPress={() => setModelModalVisible(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Model</Text>
          <Text style={styles.sectionDescription}>
            Choose which OpenAI model to use for AI features like summaries, suggestions, and translations
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Preferred Model</Text>
              <Text style={styles.settingDescription}>Select the AI model for all features</Text>
            </View>
            <TouchableOpacity
              onPress={() => setModelModalVisible(true)}
              style={styles.dropdownButton}
            >
              <Text style={styles.dropdownButtonText}>
                {aiModelOptions.find((m) => m.id === preferredAIModel)?.name || 'GPT-4o Mini'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
            AI features are powered by OpenAI models and run securely in Firebase
            Cloud Functions. You can choose your preferred model in the AI Model section above.
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
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    marginRight: 8,
    marginBottom: 8,
  },
  langPillSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F0FF',
  },
  langPillDisabled: {
    opacity: 0.5,
  },
  langPillText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  langPillTextSelected: {
    color: '#007AFF',
  },
  dropdownButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    color: '#000',
  },
  optionRow: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  optionCode: {
    fontSize: 12,
    color: '#666',
  },
  modalCloseButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EEE',
    borderRadius: 8,
  },
  modalCloseText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});

