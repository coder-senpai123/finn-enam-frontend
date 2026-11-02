import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'must-see' | 'worth-knowing' | 'routine' | 'flash' | 'pro' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'must-see':
        return { bg: '#fee2e2', text: '#ef4444', border: '#fca5a5' };
      case 'worth-knowing':
        return { bg: '#fef3c7', text: '#d97706', border: '#fde68a' };
      case 'routine':
        return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' };
      case 'flash':
        return { bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' };
      case 'pro':
        return { bg: '#f3e8ff', text: '#9333ea', border: '#e9d5ff' };
      default:
        return { bg: '#e5e7eb', text: '#374151', border: '#d1d5db' };
    }
  };

  const style = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.text, { color: style.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

