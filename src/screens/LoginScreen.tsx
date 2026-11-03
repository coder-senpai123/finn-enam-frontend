import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, isLoading } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setErrorMessage('Please enter your name to continue.');
      return;
    }
    if (cleanName.length < 2) {
      setErrorMessage('Name must be at least 2 characters long.');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    try {
      // Create clean email identifier from name for persistent backend storage
      const emailHandle = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'investor';
      const userEmail = `${emailHandle}@investor.enam.com`;

      const res = await loginWithGoogle(userEmail, cleanName);
      if (!res.success) {
        setErrorMessage(res.error || 'Could not start session. Please try again.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const busy = isLoading || submitting;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* ── Brand Header ── */}
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

        {/* ── Feature Highlights ── */}
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

        {/* ── Error Box ── */}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {errorMessage}</Text>
          </View>
        ) : null}

        {/* ── Name Entry Card ── */}
        <View style={[styles.authCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome to FINN</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            What should FINN call you? Enter your name to begin your personalised intelligence setup.
          </Text>

          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>YOUR FULL NAME</Text>
            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: colors.subtleBg,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                },
              ]}
              placeholder="e.g. Yash"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errorMessage) setErrorMessage('');
              }}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              editable={!busy}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              { backgroundColor: colors.primary },
              busy && styles.continueButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.continueButtonText}>Continue ➔</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Legal Footer ── */}
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Under SEBI regulations and Indian Contract Act (1872), equity trading is restricted to individuals 18 years of age or older.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
  cardTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 20 },

  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
  },

  continueButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  continueButtonDisabled: { opacity: 0.7 },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // Footer
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    opacity: 0.75,
  },
});
