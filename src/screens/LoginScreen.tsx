import React, { useState, useEffect } from 'react';
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
import { useGoogleAuth, parseGoogleResponse } from '../hooks/useGoogleAuth';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const { request, response, signIn } = useGoogleAuth();

  const [errorMessage, setErrorMessage] = useState('');
  const [oauthLoading, setOauthLoading] = useState(false);

  // ── Handle the Google OAuth response ──────────────────────────────────────
  useEffect(() => {
    if (!response) return;
    (async () => {
      setOauthLoading(true);
      setErrorMessage('');
      try {
        const result = await parseGoogleResponse(response);

        if (!result.success) {
          // Silently ignore user-cancelled flows
          if (result.error !== 'cancelled') {
            setErrorMessage(result.error || 'Google sign-in failed. Please try again.');
          }
          return;
        }

        // Send real Google profile to the backend
        const authRes = await loginWithGoogle(
          result.email!,
          result.name,
          result.idToken || result.accessToken,
          result.avatar,
        );

        if (!authRes.success) {
          setErrorMessage(authRes.error || 'Could not sign in. Please try again.');
        }
      } catch (e: any) {
        setErrorMessage(e.message || 'An error occurred during sign-in.');
      } finally {
        setOauthLoading(false);
      }
    })();
  }, [response]);

  // ── Button handler ────────────────────────────────────────────────────────
  const handleSignIn = () => {
    setErrorMessage('');
    signIn();
  };

  const busy = isLoading || oauthLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

        {/* ── Brand ── */}
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

        {/* ── Features ── */}
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

        {/* ── Error ── */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {errorMessage}</Text>
          </View>
        ) : null}

        {/* ── Sign-In Card ── */}
        <View style={[styles.authCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sign In</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Tap below — Google will open and let you choose an account.
          </Text>

          <TouchableOpacity
            style={[
              styles.googleButton,
              { backgroundColor: isDark ? '#ffffff' : '#4285F4' },
              busy && styles.googleButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleSignIn}
            disabled={busy}
          >
            {busy ? (
              <View style={styles.googleButtonContent}>
                <ActivityIndicator color={isDark ? '#000000' : '#ffffff'} />
                <Text style={[styles.googleButtonText, { color: isDark ? '#000000' : '#ffffff' }]}>
                  {oauthLoading ? 'Signing in…' : 'Loading…'}
                </Text>
              </View>
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

        {/* ── Legal ── */}
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Under SEBI regulations and Indian Contract Act (1872), equity trading is restricted to individuals 18 years of age or older.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  // Brand
  brandBox: { alignItems: 'center', marginBottom: 28 },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 4,
  },
  logoBadgeText: { color: '#ffffff', fontSize: 38, fontWeight: '900' },
  brandTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 1.5 },
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

  // Features
  featureCard: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  featureIcon: { fontSize: 22 },
  featureTextCol: { flex: 1 },
  featureHeading: { fontSize: 13, fontWeight: '700' },
  featureDesc: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  divider: { height: 1, marginVertical: 8 },

  // Error
  errorBox: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#991b1b', fontSize: 12, fontWeight: '600' },

  // Auth card
  authCard: {
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    marginBottom: 24,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 20 },

  // Google button
  googleButton: {
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  googleButtonDisabled: { opacity: 0.7 },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  googleG: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleGText: { fontSize: 15, fontWeight: '900' },
  googleButtonText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  // Footer
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    opacity: 0.75,
  },
});
