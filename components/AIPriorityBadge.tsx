/**
 * AIPriorityBadge Component
 * Displays a priority badge for important messages
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AIPriorityBadgeProps {
  score: number;
  reason?: string;
}

export function AIPriorityBadge({ score, reason }: AIPriorityBadgeProps) {
  // Determine badge color based on score
  const getBadgeColor = () => {
    if (score >= 9) return '#FF3B30'; // Red - Critical
    if (score >= 7) return '#FF9500'; // Orange - High
    return '#FFCC00'; // Yellow - Medium
  };

  const getPriorityLabel = () => {
    if (score >= 9) return 'CRITICAL';
    if (score >= 7) return 'HIGH';
    return 'PRIORITY';
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
      <Text style={styles.badgeText}>⚡ {getPriorityLabel()}</Text>
      {reason && <Text style={styles.reasonText}>{reason}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reasonText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
});

