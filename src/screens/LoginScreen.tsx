import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const [errorMessage, setErrorMessage] = useState('');

  const handleGoogleSignIn = async (emailOverride?: string) => {
    setErrorMessage('');
    const emailToUse = emailOverride || 'investor@enam.com';
    const res = await loginWithGoogle(emailToUse, emailToUse.split('@')[0]);
    if (!res.success) {
      setErrorMessage(res.error || 'Google Sign-In failed. Please check network connection.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Brand Header */}
        <View style={styles.brandBox}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoBadgeText}>F</Text>
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>FINN</Text>
          <Text style={[styles.brandTagline, { color: colors.primary }]}>
            Financial Investment Agent
          </Text>
          <Text style={[styles.brandSub, { color: colors.textSecondary }]}>
            Institutional equity intelligence for BSE &amp; NSE Indian public markets
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>⚡</Text>
            <View style={styles.featureTextCol}>
              <Text style={[styles.featureHeading, { color: colors.text }]}>Primary Exchange Filings</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                Materiality-scored push digest from BSE/NSE records.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🎯</Text>
            <View style={styles.featureTextCol}>
              <Text style={[styles.featureHeading, { color: colors.text }]}>Personalised Investor DNA</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                Calibrated feed based on your risk profile and portfolio.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <View style={styles.featureTextCol}>
              <Text style={[styles.featureHeading, { color: colors.text }]}>SEBI-Compliant Architecture</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                Strict 18+ legal age verification and primary data grounding.
              </Text>
            </View>
          </View>
        </View>

        {/* Error message */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {errorMessage}</Text>
          </View>
        ) : null}

        {/* Clean Google Sign-In Card */}
        <View style={[styles.authCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sign In</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Sign in with your Google account to access your personalised feed.
          </Text>

          {/* Official Google Sign-In Button */}
          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: isDark ? '#ffffff' : '#4285F4' }]}
            activeOpacity={0.85}
            onPress={() => handleGoogleSignIn()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={isDark ? '#000000' : '#ffffff'} />
            ) : (
              <View style={styles.googleButtonContent}>
                <View style={[styles.googleG, { backgroundColor: isDark ? '#4285F4' : '#ffffff' }]}>
                  <Text style={[styles.googleGText, { color: isDark ? '#ffffff' : '#4285F4' }]}>G</Text>
                </View>
                <Text style={[styles.googleButtonText, { color: isDark ? '#000000' : '#ffffff' }]}>
                  Continue with Google
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Legal Disclaimer */}
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Under SEBI regulations and Indian Contract Act (1872), equity trading is restricted to individuals 18 years of age or older.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
  },
  logoBadgeText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  brandSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  featureCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureTextCol: {
    flex: 1,
  },
  featureHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '600',
  },
  authCard: {
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    marginBottom: 24,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  googleButton: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleG: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleGText: {
    fontSize: 14,
    fontWeight: '900',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    opacity: 0.75,
  },
});
