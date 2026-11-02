import React from 'react';
import { Tabs } from 'expo-router';
import { Text, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();

  // Ensure bottom padding accounts for navigation pill/system gestures
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 20);
  const tabHeight = 54 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBg },
        headerTitleStyle: { fontWeight: '800', fontSize: 17, color: colors.text },
        headerRight: () => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleTheme}
            style={[styles.themeBtn, { backgroundColor: colors.subtleBg }]}
          >
            <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed (Push)',
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📬</Text>,
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio Watchlist',
          tabBarLabel: 'Portfolio',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="research"
        options={{
          title: 'FINN Research (Pull)',
          tabBarLabel: 'Research',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🔍</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Alerts & Rules',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>⚙️</Text>,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  themeBtn: {
    marginRight: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: {
    fontSize: 16,
  },
});
