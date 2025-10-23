import { GLASS_INTENSITY, getGlassBorder, getGlassTint } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { emitPresenceActivity } from '@/hooks/usePresenceHeartbeat';
import { BlurView } from 'expo-blur';
import React, { useCallback } from 'react';
import { ActivityIndicator, Platform, Text, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function InputBar({
  uploading,
  onPickImage,
  messageText,
  setMessageText,
  onSend,
  keyboardVisible,
}: any) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'ios'
    ? (keyboardVisible ? 8 : Math.max(8, (insets.bottom || 0) + 8))
    : 8;
  const handlePickImage = useCallback(() => {
    emitPresenceActivity();
    onPickImage && onPickImage();
  }, [onPickImage]);

  const handleChangeText = useCallback((text: string) => {
    emitPresenceActivity();
    setMessageText && setMessageText(text);
  }, [setMessageText]);

  const handleSend = useCallback(() => {
    emitPresenceActivity();
    onSend && onSend();
  }, [onSend]);

  return (
    <BlurView tint={getGlassTint(isDark)} intensity={GLASS_INTENSITY} style={{
      flexDirection: 'row',
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: bottomPadding,
      alignItems: 'center',
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: getGlassBorder(isDark),
    }}>
      <TouchableOpacity testID="chat-image-button" style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.8)', borderRadius: 20 }} onPress={handlePickImage} disabled={uploading}>
        <Text style={{ fontSize: 24 }}>📷</Text>
      </TouchableOpacity>
      <TextInput
        testID="chat-message-input"
        style={{ flex: 1, minHeight: 40, maxHeight: 100, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.08)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: isDark ? '#ECEDEE' : '#11181C', backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.85)' }}
        placeholder="Type a message..."
        value={messageText}
        onChangeText={handleChangeText}
        onFocus={emitPresenceActivity}
        multiline
        maxLength={1000}
        editable={!uploading}
      />
      <TouchableOpacity
        testID="chat-send-button"
        style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, minWidth: 70, height: 40, backgroundColor: (!messageText?.trim() || uploading) ? (isDark ? 'rgba(255,255,255,0.2)' : '#ccc') : '#007AFF', borderRadius: 20 }}
        onPress={handleSend}
        disabled={!messageText?.trim() || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Send</Text>
        )}
      </TouchableOpacity>
    </BlurView>
  );
}


