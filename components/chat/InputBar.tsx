import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';

export function InputBar({
  uploading,
  onPickImage,
  messageText,
  setMessageText,
  onSend,
}: any) {
  return (
    <View style={{
      flexDirection: 'row',
      padding: 8,
      borderTopWidth: 1,
      borderTopColor: '#f0f0f0',
      backgroundColor: '#fff',
      alignItems: 'center',
      gap: 8,
    }}>
      <TouchableOpacity testID="chat-image-button" style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0', borderRadius: 20 }} onPress={onPickImage} disabled={uploading}>
        <Text style={{ fontSize: 24 }}>📷</Text>
      </TouchableOpacity>
      <TextInput
        testID="chat-message-input"
        style={{ flex: 1, minHeight: 40, maxHeight: 100, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16 }}
        placeholder="Type a message..."
        value={messageText}
        onChangeText={setMessageText}
        multiline
        maxLength={1000}
        editable={!uploading}
      />
      <TouchableOpacity
        testID="chat-send-button"
        style={{ justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, minWidth: 70, height: 40, backgroundColor: (!messageText?.trim() || uploading) ? '#ccc' : '#007AFF', borderRadius: 20 }}
        onPress={onSend}
        disabled={!messageText?.trim() || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Send</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}


