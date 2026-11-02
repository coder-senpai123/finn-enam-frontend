import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { POPULAR_NSE_STOCKS, StockSuggestion } from '../constants/stocks';
import { InvestorPersonality } from '../types';

const POPULAR_TICKERS = [
  'RELIANCE',
  'TCS',
  'HDFCBANK',
  'INFY',
  'TATAMOTORS',
  'ICICIBANK',
  'ITC',
  'SUNPHARMA',
  'TITAN',
  'HAL',
  'PERSISTENT',
  'ZOMATO',
];

export const OnboardingScreen: React.FC = () => {
  const { user, completeOnboarding, logout } = useAuth();
  const { colors, isDark } = useTheme();

  // Wizard state: 1 = Age, 2 = Investor Type, 3 = Portfolio Stocks, 4 = Personality Reveal
  const [step, setStep] = useState(1);
  const [ageInput, setAgeInput] = useState('');
  const [investorType, setInvestorType] = useState<string>('Long-Term Investor');
  const [selectedStocks, setSelectedStocks] = useState<string[]>(['RELIANCE', 'TCS', 'HDFCBANK', 'INFY']);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPersonality, setGeneratedPersonality] = useState<InvestorPersonality | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const ageNumber = parseInt(ageInput.trim(), 10);
  const isAgeValid = !isNaN(ageNumber) && ageNumber >= 18;
  const isUnderage = !isNaN(ageNumber) && ageNumber > 0 && ageNumber < 18;

  // Filter stock suggestions
  const stockSuggestions: StockSuggestion[] = searchQuery.trim().length > 0
    ? POPULAR_NSE_STOCKS.filter(
        (s: StockSuggestion) =>
          s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const toggleStock = (ticker: string) => {
    const clean = ticker.toUpperCase().trim();
    if (selectedStocks.includes(clean)) {
      setSelectedStocks(selectedStocks.filter((s) => s !== clean));
    } else {
      setSelectedStocks([...selectedStocks, clean]);
    }
  };

  const handleGeneratePersonality = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      // Synthesize on-device/backend preview for Step 4
      const inv = investorType.toLowerCase();
      let archetype = "The Disciplined Compounder";
      let tagline = "Patient capital focused on balance sheet safety and return on capital moats.";
      let description = `At ${ageNumber} years of age, you approach Indian equities with a multi-year horizon, prioritizing businesses with consistent ROCE/ROE (>15%), prudent leverage, and enduring competitive moats.`;
      let traits = ["Balance Sheet Solvency", "Cash Quality & Free Cash Flow", "Low Turnover Compounding"];
      let feedFocus = "Annual reports, capital expenditure disclosures, and long-term earnings durability.";

      if (inv.includes("short") || inv.includes("risk")) {
        archetype = "The Tactical Momentum Hunter";
        tagline = "Agile participant seeking asymmetric risk-reward on breakout catalysts and volume shifts.";
        description = `At ${ageNumber} years of age, you seek high-beta alpha in dynamic stocks, prioritizing immediate price catalysts, institutional volume spikes, and breaking material filings.`;
        traits = ["Catalyst Sensitivity", "Volume Breakout Tracking", "High Risk-Reward Asymmetry"];
        feedFocus = "Breaking exchange disclosures, volume spikes > 2x average, and earnings surprises.";
      } else if (inv.includes("regular")) {
        archetype = "The Strategic Growth Allocator";
        tagline = "Balanced wealth builder evaluating operational trajectory against fair valuations.";
        description = `At ${ageNumber} years of age, you maintain a balanced portfolio, analyzing quarterly revenue/margin trends and PEG multiples to capture steady Indian market growth.`;
        traits = ["Quarterly Momentum", "Fair Valuation Multiple", "Segmental Growth"];
        feedFocus = "Quarterly financial results, management concalls, and strategic expansion filings.";
      }

      setGeneratedPersonality({
        archetype,
        tagline,
        description,
        key_traits: traits,
        feed_focus: feedFocus,
        risk_profile: inv.includes("short") ? "Aggressive" : inv.includes("long") ? "Moderate Conservative" : "Moderate",
        priority_categories: ["results", "capex", "dividend"],
      });
      setStep(4);
    } catch (e: any) {
      setErrorMessage(e.message || 'Error generating personality.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishOnboarding = async () => {
    setIsLoading(true);
    await completeOnboarding(ageNumber, investorType, selectedStocks);
    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.bg }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Indicator */}
        <View style={styles.topBar}>
          <Text style={[styles.stepIndicator, { color: colors.primary }]}>
            STEP {step} OF 4 • FIRST TIME SETUP
          </Text>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={[styles.logoutBtnText, { color: colors.textMuted }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Dots */}
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.dot,
                { backgroundColor: colors.cardBorder },
                step >= s && { backgroundColor: colors.primary, width: 24 },
              ]}
            />
          ))}
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {errorMessage}</Text>
          </View>
        ) : null}

        {/* ================= STEP 1: LEGAL AGE VERIFICATION ================= */}
        {step === 1 && (
          <View style={[styles.stepCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.stepIcon}>⚖️</Text>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Legal Eligibility Verification</Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
              Under SEBI regulations and the Indian Contract Act (1872), an individual must be at least 18 years of age to trade securities on the BSE &amp; NSE.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Enter Your Age</Text>
              <TextInput
                style={[
                  styles.ageInput,
                  {
                    backgroundColor: colors.subtleBg,
                    color: colors.text,
                    borderColor: isUnderage ? '#ef4444' : isAgeValid ? '#10b981' : colors.cardBorder,
                  },
                ]}
                placeholder="e.g. 25"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={3}
                value={ageInput}
                onChangeText={setAgeInput}
              />
            </View>

            {/* Validation Feedback */}
            {isUnderage && (
              <View style={styles.underageBox}>
                <Text style={styles.underageTitle}>⛔ Legally Ineligible to Trade</Text>
                <Text style={styles.underageText}>
                  You must be at least 18 years old to actively trade Indian equities and operate a trading portfolio under SEBI rules.
                </Text>
              </View>
            )}

            {isAgeValid && (
              <View style={styles.validAgeBox}>
                <Text style={styles.validAgeText}>
                  ✓ Age verified ({ageNumber} yrs). Legally eligible to trade Indian equities.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.nextButton,
                { backgroundColor: colors.primary },
                !isAgeValid && styles.disabledButton,
              ]}
              disabled={!isAgeValid}
              onPress={() => setStep(2)}
            >
              <Text style={styles.nextButtonText}>Confirm &amp; Proceed ➔</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= STEP 2: INVESTOR PROFILE CLASSIFICATION ================= */}
        {step === 2 && (
          <View style={[styles.stepCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.stepIcon}>🎯</Text>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Your Investment Approach</Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
              How do you approach Indian public equities? FINN uses this to prioritize filings and calibrate risk verdicts.
            </Text>

            {/* Option 1: Long-Term Investor */}
            <TouchableOpacity
              style={[
                styles.personaCard,
                {
                  backgroundColor: colors.subtleBg,
                  borderColor: investorType === 'Long-Term Investor' ? colors.primary : colors.cardBorder,
                },
                investorType === 'Long-Term Investor' && styles.selectedPersona,
              ]}
              onPress={() => setInvestorType('Long-Term Investor')}
            >
              <View style={styles.personaHeader}>
                <Text style={styles.personaBadge}>🟢</Text>
                <Text style={[styles.personaTitle, { color: colors.text }]}>Long-Term Investor</Text>
              </View>
              <Text style={[styles.personaDesc, { color: colors.textSecondary }]}>
                Values capital preservation, ROCE moats (&gt;15%), low churn, and 3-5+ year compounding.
              </Text>
              <Text style={[styles.personaTrigger, { color: colors.primary }]}>
                Feed Boost: Annual reports, capex plans, dividends, and solvency.
              </Text>
            </TouchableOpacity>

            {/* Option 2: Regular Investor */}
            <TouchableOpacity
              style={[
                styles.personaCard,
                {
                  backgroundColor: colors.subtleBg,
                  borderColor: investorType === 'Regular Investor' ? colors.primary : colors.cardBorder,
                },
                investorType === 'Regular Investor' && styles.selectedPersona,
              ]}
              onPress={() => setInvestorType('Regular Investor')}
            >
              <View style={styles.personaHeader}>
                <Text style={styles.personaBadge}>🔵</Text>
                <Text style={[styles.personaTitle, { color: colors.text }]}>Regular Investor</Text>
              </View>
              <Text style={[styles.personaDesc, { color: colors.textSecondary }]}>
                Balanced approach tracking quarterly earnings traction, guidance delivery, and PEG multiples.
              </Text>
              <Text style={[styles.personaTrigger, { color: colors.primary }]}>
                Feed Boost: Quarterly results, concall summaries, and growth execution.
              </Text>
            </TouchableOpacity>

            {/* Option 3: Short-Term Risk-Taker */}
            <TouchableOpacity
              style={[
                styles.personaCard,
                {
                  backgroundColor: colors.subtleBg,
                  borderColor: investorType === 'Short-Term Risk-Taker' ? colors.primary : colors.cardBorder,
                },
                investorType === 'Short-Term Risk-Taker' && styles.selectedPersona,
              ]}
              onPress={() => setInvestorType('Short-Term Risk-Taker')}
            >
              <View style={styles.personaHeader}>
                <Text style={styles.personaBadge}>🔴</Text>
                <Text style={[styles.personaTitle, { color: colors.text }]}>Short-Term Risk-Taker</Text>
              </View>
              <Text style={[styles.personaDesc, { color: colors.textSecondary }]}>
                Agile market participant looking for asymmetric alpha, volume spikes (&gt;2x), and breakout triggers.
              </Text>
              <Text style={[styles.personaTrigger, { color: colors.primary }]}>
                Feed Boost: High materiality breaking filings, M&amp;A, leadership shifts, and volume moves.
              </Text>
            </TouchableOpacity>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.backButton, { borderColor: colors.cardBorder }]}
                onPress={() => setStep(1)}
              >
                <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextButtonFlex, { backgroundColor: colors.primary }]}
                onPress={() => setStep(3)}
              >
                <Text style={styles.nextButtonText}>Continue ➔</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 3: SEED PORTFOLIO STOCKS ================= */}
        {step === 3 && (
          <View style={[styles.stepCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.stepIcon}>📊</Text>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Seed Your Portfolio Watchlist</Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
              Select the BSE/NSE companies in your portfolio or watchlist. FINN will monitor their live exchange filings and tailor your feed.
            </Text>

            {/* Search Stock Input */}
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.subtleBg,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                placeholder="🔍 Search ticker or company name..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {stockSuggestions.length > 0 && (
                <View style={[styles.dropdown, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                  {stockSuggestions.map((item: StockSuggestion) => (
                    <TouchableOpacity
                      key={item.ticker}
                      style={[styles.dropdownItem, { borderBottomColor: colors.cardBorder }]}
                      onPress={() => {
                        toggleStock(item.ticker);
                        setSearchQuery('');
                      }}
                    >
                      <Text style={[styles.dropdownTicker, { color: colors.text }]}>{item.ticker}</Text>
                      <Text style={[styles.dropdownName, { color: colors.textSecondary }]}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Selected Count */}
            <View style={styles.selectedCountRow}>
              <Text style={[styles.selectedCountText, { color: colors.primary }]}>
                Selected ({selectedStocks.length} stocks):
              </Text>
            </View>

            {/* Popular Stocks Cloud */}
            <View style={styles.chipsCloud}>
              {POPULAR_TICKERS.map((ticker) => {
                const isSelected = selectedStocks.includes(ticker);
                return (
                  <TouchableOpacity
                    key={ticker}
                    style={[
                      styles.stockChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.subtleBg,
                        borderColor: isSelected ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    onPress={() => toggleStock(ticker)}
                  >
                    <Text
                      style={[
                        styles.stockChipText,
                        { color: isSelected ? '#ffffff' : colors.text },
                      ]}
                    >
                      {isSelected ? `✓ ${ticker}` : `+ ${ticker}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.backButton, { borderColor: colors.cardBorder }]}
                onPress={() => setStep(2)}
              >
                <Text style={[styles.backButtonText, { color: colors.text }]}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.nextButtonFlex,
                  { backgroundColor: colors.primary },
                  selectedStocks.length === 0 && styles.disabledButton,
                ]}
                disabled={selectedStocks.length === 0 || isLoading}
                onPress={handleGeneratePersonality}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.nextButtonText}>✨ Generate Personality</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 4: AI PERSONALITY REVEAL ================= */}
        {step === 4 && (
          <View style={[styles.stepCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={styles.stepIcon}>✨</Text>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Your Investor Personality</Text>
            <Text style={[styles.stepSub, { color: colors.textSecondary }]}>
              Generated by FINN AI grounded in your legal age ({ageNumber}), investment approach, and seed portfolio.
            </Text>

            {/* Personality Reveal Box */}
            <View style={[styles.personalityBox, { backgroundColor: isDark ? '#141d2b' : '#f0fdf4', borderColor: '#10b981' }]}>
              <View style={styles.archetypeBadge}>
                <Text style={styles.archetypeText}>
                  {user?.personality?.archetype || generatedPersonality?.archetype || 'The Disciplined Compounder'}
                </Text>
              </View>

              <Text style={[styles.personaMotto, { color: colors.text }]}>
                "{user?.personality?.tagline || generatedPersonality?.tagline || 'Focus on capital preservation and ROCE durability.'}"
              </Text>

              <Text style={[styles.personaFullDesc, { color: colors.textSecondary }]}>
                {user?.personality?.description || generatedPersonality?.description || 'Your profile emphasizes balance sheet strength and sustainable competitive moats.'}
              </Text>

              {/* Key Traits Pills */}
              <View style={styles.traitsRow}>
                {(user?.personality?.key_traits || generatedPersonality?.key_traits || ['Margin of Safety', 'Moat Compounding', 'Low Churn']).map((trait: string, idx: number) => (
                  <View key={idx} style={[styles.traitPill, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.traitText, { color: colors.primary }]}>• {trait}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.focusBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Text style={[styles.focusLabel, { color: colors.primary }]}>🎯 Tailored Feed Calibration:</Text>
                <Text style={[styles.focusDesc, { color: colors.textSecondary }]}>
                  {user?.personality?.feed_focus || generatedPersonality?.feed_focus || 'Your feed will prioritize primary filings aligned with your risk tolerance.'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: colors.primary }]}
              onPress={handleFinishOnboarding}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.nextButtonText}>🚀 Launch Personalised Feed</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 44,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoutBtn: {
    padding: 4,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '600',
  },
  stepCard: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    elevation: 2,
  },
  stepIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  stepSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  ageInput: {
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
  },
  underageBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  underageTitle: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  underageText: {
    color: '#b91c1c',
    fontSize: 12,
    lineHeight: 16,
  },
  validAgeBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  validAgeText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '700',
  },
  nextButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  nextButtonFlex: {
    flex: 2,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  backButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  personaCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
  },
  selectedPersona: {
    borderWidth: 2,
  },
  personaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  personaBadge: {
    fontSize: 16,
  },
  personaTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  personaDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  personaTrigger: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    marginBottom: 12,
    position: 'relative',
    zIndex: 10,
  },
  searchInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  dropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 4,
    zIndex: 20,
    maxHeight: 180,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
  },
  dropdownTicker: {
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownName: {
    fontSize: 11,
  },
  selectedCountRow: {
    marginBottom: 8,
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  stockChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  stockChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  personalityBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  archetypeBadge: {
    backgroundColor: '#10b981',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginBottom: 10,
  },
  archetypeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  personaMotto: {
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 8,
  },
  personaFullDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  traitsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  traitPill: {
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  traitText: {
    fontSize: 11,
    fontWeight: '700',
  },
  focusBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
  },
  focusLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  focusDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
});
