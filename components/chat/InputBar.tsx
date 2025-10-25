import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, GLASS_INTENSITY, getGlassBorder, getGlassTint } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { emitPresenceActivity } from '@/hooks/usePresenceActivity';
import { BlurView } from 'expo-blur';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const addedPadding = Platform.OS === 'ios' ? 0 : 8;

export function InputBar({
  uploading,
  onPickImage,
  messageText,
  setMessageText,
  onSend,
  keyboardVisible,
  onOpenAISummary,
  onOpenAISuggestions,
  onTyping,
  onTypingStop,
}: any) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const bottomPadding = keyboardVisible ? 8 : Math.max(addedPadding, (insets.bottom || 0) + addedPadding);
  const handlePickImage = useCallback(() => {
    emitPresenceActivity();
    onPickImage && onPickImage();
  }, [onPickImage]);

  const handleChangeText = useCallback((text: string) => {
    emitPresenceActivity();
    onTyping && onTyping();
    setMessageText && setMessageText(text);
  }, [setMessageText, onTyping]);

  const handleSend = useCallback(() => {
    emitPresenceActivity();
    onSend && onSend();
    onTypingStop && onTypingStop();
  }, [onSend, onTypingStop]);

  const [aiShelfVisible, setAIShelfVisible] = useState(false);
  const [aiAnchor, setAIAnchor] = useState<{ x: number; y: number; w: number; h: number }>({ x: 0, y: 0, w: 0, h: 0 });
  const aiBtnRef = useRef<any>(null);

  const openAIShelf = useCallback(() => {
    if (uploading) return;
    // measure button location in window for anchoring
    requestAnimationFrame(() => {
      try {
        (aiBtnRef.current as any)?.measureInWindow?.((x: number, y: number, w: number, h: number) => {
          setAIAnchor({ x, y, w, h });
          setAIShelfVisible(true);
        });
      } catch {
        setAIShelfVisible(true);
      }
    });
  }, [uploading]);

  const closeAIShelf = useCallback(() => setAIShelfVisible(false), []);

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
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="AI menu"
        onPress={openAIShelf}
        disabled={uploading}
        style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
        ref={aiBtnRef as any}
      >
        <IconSymbol name="sparkles" size={24} color={isDark ? Colors.dark.icon : Colors.light.icon} />
      </TouchableOpacity>
      <TouchableOpacity
        testID="chat-image-button"
        accessibilityRole="button"
        accessibilityLabel="Pick image"
        style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
        onPress={handlePickImage}
        disabled={uploading}
      >
        <IconSymbol name="camera" size={Platform.OS === 'ios' ? 32 : 24} weight="semibold" color={isDark ? Colors.dark.icon : Colors.light.icon} />
      </TouchableOpacity>
      <TextInput
        testID="chat-message-input"
        style={{ flex: 1, minHeight: 40, maxHeight: 100, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.08)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 18, color: isDark ? '#ECEDEE' : '#11181C', backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.85)' }}
        placeholder="Type message..."
        value={messageText}
        onChangeText={handleChangeText}
        onFocus={emitPresenceActivity}
        onBlur={() => { emitPresenceActivity(); onTypingStop && onTypingStop(); }}
        multiline
        maxLength={1000}
        editable={!uploading}
      />
      <TouchableOpacity
        testID="chat-send-button"
        style={{ justifyContent: 'center', alignItems: 'center', width: 40, height: 40 }}
        onPress={handleSend}
        disabled={!messageText?.trim() || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <IconSymbol name="paperplane.fill" size={28} color={isDark ? Colors.dark.icon : Colors.light.icon} />
        )}
      </TouchableOpacity>

      {/* AI Shelf Popover */}
      {aiShelfVisible && (
        <Modal transparent animationType="fade" onRequestClose={closeAIShelf}>
          <TouchableOpacity activeOpacity={1} onPress={closeAIShelf} style={{ flex: 1 }}>
            {/* Empty overlay to capture outside taps */}
            <View style={{ flex: 1 }}>
              {(() => {
                const { width: winW } = Dimensions.get('window');
                const shelfW = 220;
                const padding = 8;
                let left = Math.max(padding, aiAnchor.x + aiAnchor.w / 2 - shelfW / 2);
                if (left + shelfW + padding > winW) left = winW - shelfW - padding;
                const top = Math.max(0, aiAnchor.y - 8 - 88); // place ~88px above button
                return (
                  <View pointerEvents="box-none" style={{ position: 'absolute', left, top }}>
                    {/* Shelf card */}
                    <View style={{ width: shelfW, borderRadius: 12, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
                      <TouchableOpacity onPress={() => { closeAIShelf(); onOpenAISummary && onOpenAISummary(); }} style={{ paddingHorizontal: 12, paddingVertical: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111' }}>Chat Summary</Text>
                        <Text style={{ fontSize: 13, color: '#555', marginTop: 2 }}>Quick recap of this conversation</Text>
                      </TouchableOpacity>
                      <View style={{ height: 1, backgroundColor: '#F0F0F0' }} />
                      <TouchableOpacity onPress={() => { closeAIShelf(); onOpenAISuggestions && onOpenAISuggestions(); }} style={{ paddingHorizontal: 12, paddingVertical: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111' }}>AI Response Suggestions</Text>
                        <Text style={{ fontSize: 13, color: '#555', marginTop: 2 }}>Smart replies to use right away</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })()}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </BlurView>
  );
}


