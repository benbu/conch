import { ChatUITokens, SizeVariant } from '@/themes/previewThemes';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ThemedInputBarProps {
  tokens: ChatUITokens;
  size: SizeVariant;
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
}

export function ThemedInputBar({ tokens, size, value, onChangeText, onSend }: ThemedInputBarProps) {
  const height = size === 'compact' ? 40 : size === 'cozy' ? 44 : 48;
  const radius = size === 'compact' ? 16 : size === 'cozy' ? 18 : 20;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderTopWidth: 1, borderTopColor: tokens.separator, backgroundColor: tokens.cardBackground }}>
      <TextInput
        style={{ flex: 1, minHeight: height, maxHeight: 120, borderWidth: 1, borderColor: tokens.inputBorder, backgroundColor: tokens.inputBg, borderRadius: radius, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16 }}
        placeholder="Type message..."
        value={value}
        onChangeText={onChangeText}
        multiline
      />
      <TouchableOpacity onPress={onSend} disabled={!value.trim()} style={{ height, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: value.trim() ? tokens.sendButtonBg : tokens.separator, borderRadius: radius }}>
        <Text style={{ color: '#fff', fontWeight: '600' }}>Send</Text>
      </TouchableOpacity>
    </View>
  );
}


