import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getEffectiveBaseUrl, setBackendUrl, api } from '../api';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, isLoading } = useAuth();
  const { colors, isDark } = useTheme();

  const [errorMessage, setErrorMessage] = useState('');
  const [currentBackendUrl, setCurrentBackendUrl] = useState(getEffectiveBaseUrl());
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [inputUrl, setInputUrl] = useState('https://finn-enam-backend.onrender.com');
  const [testingUrl, setTestingUrl] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Email prompt modal
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('investor@enam.com');

  useEffect(() => {
    // Check initial server health
    api.getAuthStatus().then((res) => {
      setServerOnline(!!res);
    }).catch(() => {
      setServerOnline(false);
    });
  }, [currentBackendUrl]);

  const handleGoogleSignIn = async (emailOverride?: string) => {
    setErrorMessage('');
    const emailToUse = emailOverride || googleEmail.trim() || 'investor@enam.com';
    const res = await loginWithGoogle(emailToUse, emailToUse.split('@')[0]);
    if (!res.success) {
      setErrorMessage(
        `${res.error || 'Connection failed.'}\n(Target server: ${currentBackendUrl})`
      );
    }
  };

  const handleSaveBackendUrl = async () => {
    if (!inputUrl.trim()) return;
    setTestingUrl(true);
    const result = await setBackendUrl(inputUrl.trim());
    setTestingUrl(false);

    if (result.success) {
      const newUrl = getEffectiveBaseUrl();
      setCurrentBackendUrl(newUrl);
      setServerOnline(true);
      setUrlModalVisible(false);
      Alert.alert('Server Connected', `Successfully connected to:\n${newUrl}`);
    } else {
      Alert.alert('Connection Failed', `Could not reach ${inputUrl}.\nError: ${result.error}`);
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
            <TouchableOpacity
              style={styles.errorFixBtn}
              onPress={() => {
                setInputUrl(currentBackendUrl.replace('/api', ''));
                setUrlModalVisible(true);
              }}
            >
              <Text style={styles.errorFixBtnText}>⚙ Update Backend URL</Text>
            </TouchableOpacity>
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
            onPress={() => setEmailModalVisible(true)}
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

          {/* Backend Status & Change Button */}
          <View style={styles.serverStatusRow}>
            <View style={[styles.statusDot, { backgroundColor: serverOnline ? '#10b981' : '#f59e0b' }]} />
            <Text style={[styles.serverStatusText, { color: colors.textMuted }]} numberOfLines={1}>
              {serverOnline ? 'Backend Online: ' : 'Target: '}
              {currentBackendUrl.replace('http://', '').replace('https://', '')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setInputUrl(currentBackendUrl.replace('/api', ''));
                setUrlModalVisible(true);
              }}
            >
              <Text style={[styles.changeServerText, { color: colors.primary }]}>[Change]</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Disclaimer */}
        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Under SEBI regulations and Indian Contract Act (1872), equity trading is restricted to individuals 18 years of age or older.
        </Text>
      </ScrollView>

      {/* ================= GOOGLE EMAIL SELECTION MODAL ================= */}
      <Modal visible={emailModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeaderRow}>
              <View style={[styles.googleGSmall, { backgroundColor: '#4285F4' }]}>
                <Text style={styles.googleGTextSmall}>G</Text>
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Google Sign-In</Text>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Enter or confirm the Google Account email you wish to sign in with:
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.subtleBg, color: colors.text, borderColor: colors.cardBorder },
              ]}
              placeholder="yourname@gmail.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={googleEmail}
              onChangeText={setGoogleEmail}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setEmailModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setEmailModalVisible(false);
                  handleGoogleSignIn(googleEmail);
                }}
              >
                <Text style={styles.modalConfirmText}>Sign In ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= CONFIGURE BACKEND URL MODAL ================= */}
      <Modal visible={urlModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>⚙ Backend Server URL</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              If your backend is deployed on Render, paste its URL below so the app connects to it:
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.subtleBg, color: colors.text, borderColor: colors.cardBorder },
              ]}
              placeholder="https://your-backend.onrender.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              value={inputUrl}
              onChangeText={setInputUrl}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setUrlModalVisible(false)}
                disabled={testingUrl}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveBackendUrl}
                disabled={testingUrl}
              >
                {testingUrl ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Connect &amp; Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 6,
  },
  errorFixBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  errorFixBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
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
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  serverStatusText: {
    fontSize: 10,
    flex: 1,
  },
  changeServerText: {
    fontSize: 10,
    fontWeight: '700',
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    opacity: 0.75,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  googleGSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleGTextSmall: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    marginTop: 4,
  },
  modalInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
