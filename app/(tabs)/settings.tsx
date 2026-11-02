import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';

export default function SettingsScreen() {
  const [volAlert, setVolAlert] = useState(true);
  const [priceAlert, setPriceAlert] = useState(true);
  const [resultsAlert, setResultsAlert] = useState(true);
  const [mgmtAlert, setMgmtAlert] = useState(true);
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of FINN?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* 1. User Profile & Investor DNA Card */}
      {user && (
        <>
          <Text style={[styles.header, { color: colors.primary }]}>INVESTOR PROFILE &amp; DNA</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {(user.name || user.email || 'I').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileCol}>
                <Text style={[styles.profileName, { color: colors.text }]}>{user.name || 'Investor'}</Text>
                <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{user.email}</Text>
              </View>
              <TouchableOpacity
                style={[styles.signOutPill, { borderColor: '#ef4444' }]}
                onPress={handleLogout}
              >
                <Text style={styles.signOutPillText}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            {user.personality && (
              <View style={[styles.personaSnippet, { backgroundColor: colors.subtleBg }]}>
                <View style={styles.archetypeBadge}>
                  <Text style={styles.archetypeText}>🎯 {user.personality.archetype}</Text>
                </View>
                <Text style={[styles.personaMotto, { color: colors.text }]}>
                  "{user.personality.tagline}"
                </Text>
                <View style={styles.traitsRow}>
                  {user.personality.key_traits?.map((t: string, idx: number) => (
                    <View key={idx} style={[styles.traitPill, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                      <Text style={[styles.traitText, { color: colors.primary }]}>• {t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />

            {/* SEBI Compliance & Legal Age */}
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>⚖️</Text>
              <View style={styles.metaCol}>
                <Text style={[styles.metaTitle, { color: colors.text }]}>
                  Age: {user.age || '18+'} • SEBI / Indian Contract Act Verified
                </Text>
                <Text style={[styles.metaSub, { color: colors.textMuted }]}>
                  Legally compliant to trade Indian equities on BSE &amp; NSE.
                </Text>
              </View>
            </View>

            <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />

            {/* Seed Portfolio */}
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📊</Text>
              <View style={styles.metaCol}>
                <Text style={[styles.metaTitle, { color: colors.text }]}>
                  Watchlist: {user.portfolio_stocks?.length || 0} Companies Tracked
                </Text>
                <Text style={[styles.metaSub, { color: colors.textMuted }]}>
                  {user.portfolio_stocks?.join(', ') || 'RELIANCE, TCS, HDFCBANK, INFY'}
                </Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* 2. Dark Mode Control Card */}
      <Text style={[styles.header, { color: colors.primary }]}>APPEARANCE</Text>
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.row}>
          <View style={styles.textCol}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Dark Theme</Text>
            <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
              {isDark ? 'Dark theme is active (battery efficient & easy on eyes)' : 'Light theme is active'}
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#cbd5e1', true: colors.primary }}
            thumbColor={isDark ? '#ffffff' : '#f8fafc'}
          />
        </View>
      </View>

      {/* 3. Triggered Alert Thresholds */}
      <Text style={[styles.header, { color: colors.primary }]}>TRIGGERED ALERT THRESHOLDS</Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        FINN monitors your portfolio and reaches out when thresholds cross.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.row}>
          <View style={styles.textCol}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Volume Spikes (&gt; 2.0x 20D Avg)</Text>
            <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
              Detect unusual institutional accumulation or liquidation.
            </Text>
          </View>
          <Switch
            value={volAlert}
            onValueChange={setVolAlert}
            trackColor={{ false: '#cbd5e1', true: colors.primary }}
          />
        </View>

        <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />

        <View style={styles.row}>
          <View style={styles.textCol}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Daily Price Move (&gt; ±3.0%)</Text>
            <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
              Flag abnormal single-day EOD price swings.
            </Text>
          </View>
          <Switch
            value={priceAlert}
            onValueChange={setPriceAlert}
            trackColor={{ false: '#cbd5e1', true: colors.primary }}
          />
        </View>

        <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />

        <View style={styles.row}>
          <View style={styles.textCol}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Quarterly Results Disclosures</Text>
            <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
              Extract Revenue, EBITDA, PAT with QoQ and YoY delta.
            </Text>
          </View>
          <Switch
            value={resultsAlert}
            onValueChange={setResultsAlert}
            trackColor={{ false: '#cbd5e1', true: colors.primary }}
          />
        </View>

        <View style={[styles.separator, { backgroundColor: colors.cardBorder }]} />

        <View style={styles.row}>
          <View style={styles.textCol}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>C-Suite &amp; Management Change</Text>
            <Text style={[styles.rowDesc, { color: colors.textMuted }]}>
              Surface incoming executive bio and previous credentials.
            </Text>
          </View>
          <Switch
            value={mgmtAlert}
            onValueChange={setMgmtAlert}
            trackColor={{ false: '#cbd5e1', true: colors.primary }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 12,
  },
  sub: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  profileCol: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  signOutPill: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  signOutPillText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  personaSnippet: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  archetypeBadge: {
    backgroundColor: '#10b981',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  archetypeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  personaMotto: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: 8,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  traitPill: {
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  traitText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  metaIcon: {
    fontSize: 18,
  },
  metaCol: {
    flex: 1,
  },
  metaTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  metaSub: {
    fontSize: 11,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  textCol: {
    flex: 1,
    paddingRight: 16,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  separator: {
    height: 1,
    marginVertical: 8,
  },
});
