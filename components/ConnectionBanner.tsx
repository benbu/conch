// Connection status banner component
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function ConnectionBanner() {
  const { isConnected } = useNetworkStatus();

  if (isConnected) {
    return null; // Don't show anything when connected
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>📡 No internet connection</Text>
      <Text style={styles.subtext}>Messages will be sent when you're back online</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF9500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
});

