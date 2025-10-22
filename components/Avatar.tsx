import { User } from '@/types';
import React from 'react';
import { Image, Text, View } from 'react-native';

interface AvatarProps {
  user?: Pick<User, 'id' | 'displayName' | 'photoURL'>;
  size?: number;
  uri?: string;
}

function colorFromString(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

export default function Avatar({ user, size = 40, uri }: AvatarProps) {
  const sourceUri = uri ?? user?.photoURL ?? null;
  const keyString = (user?.id || user?.displayName || '?').toString();
  const bg = colorFromString(keyString);
  const letter = (user?.displayName?.charAt(0).toUpperCase() || '?');

  if (sourceUri) {
    return (
      <Image
        source={{ uri: sourceUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '600', fontSize: size * 0.4 }}>
        {letter}
      </Text>
    </View>
  );
}


