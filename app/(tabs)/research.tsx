import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../../src/api';
import { ResearchOutput } from '../../src/types';
import { Badge } from '../../src/components/common/Badge';
import { MarkdownRenderer } from '../../src/components/common/MarkdownRenderer';
import { useTheme } from '../../src/context/ThemeContext';
import { getSuggestions, StockSuggestion } from '../../src/constants/stocks';

const MODULES = [
  { id: 'narrative_vs_numbers', label: 'Narrative vs Numbers' },
  { id: 'financial_snapshot', label: 'Financial Snapshot' },
  { id: 'bull_bear', label: 'Bull vs Bear Case' },
  { id: 'trajectory', label: 'Multi-Year Trajectory' },
  { id: 'balance_sheet', label: 'Balance Sheet & Debt' },
  { id: 'cash_quality', label: 'Cash Flow Quality' },
  { id: 'guidance', label: 'Guidance Track Record' },
  { id: 'business_snapshot', label: 'Business Segments' },
];

export default function ResearchScreen() {
  const [ticker, setTicker] = useState('INFY');
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [selectedModule, setSelectedModule] = useState('narrative_vs_numbers');
  const [customQuery, setCustomQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchOutput | null>(null);
  const { colors } = useTheme();

  const handleTickerChange = (val: string) => {
    const upper = val.toUpperCase();
    setTicker(upper);
    if (upper.trim().length >= 1) {
      setSuggestions(getSuggestions(upper));
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (s: StockSuggestion) => {
    setTicker(s.ticker);
    setSuggestions([]);
  };

  const handleResearch = async () => {
    const clean = ticker.trim().toUpperCase();
    if (!clean) return;
    setSuggestions([]);
    setLoading(true);
    try {
      const data = await api.performResearch(clean, selectedModule, customQuery);
      setResult(data);
    } catch (e: any) {
      setResult({
        ticker: clean,
        module: selectedModule,
        model_used: 'gemini-3.5-flash',
        title: `Research Error for ${clean}`,
        summary: `Network connection to backend failed (${e.message}). Ensure backend is running.`,
        sources: [],
        generated_at: new Date().toISOString()
      });
    }
    setLoading(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionHeader, { color: colors.primary }]}>ON-DEMAND PULL RESEARCH</Text>
      <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
        Strictly grounded in primary sources (Exchange filings, ARs, concalls).
      </Text>

      {/* Ticker Input with Real-Time Suggestions */}
      <View style={styles.inputContainer}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ENTER ANY NSE TICKER:</Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
              color: colors.text,
            },
          ]}
          value={ticker}
          onChangeText={handleTickerChange}
          placeholder="e.g. RELIANCE, TCS, INFY, HDFCBANK"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
        />

        {/* Real-time suggestions dropdown */}
        {suggestions.length > 0 && (
          <View style={[styles.suggestionsDropdown, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.ticker}
                style={[styles.suggestionItem, { borderBottomColor: colors.cardBorder }]}
                onPress={() => selectSuggestion(item)}
              >
                <View style={styles.suggestionRow}>
                  <Text style={[styles.suggestionTicker, { color: colors.primary }]}>{item.ticker}</Text>
                  <Text style={[styles.suggestionSector, { color: colors.textMuted }]}>{item.sector}</Text>
                </View>
                <Text style={[styles.suggestionName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Module Selector Chips */}
      <Text style={[styles.chipHeader, { color: colors.textSecondary }]}>SELECT ANALYSIS MODULE:</Text>
      <View style={styles.chipGrid}>
        {MODULES.map((m) => {
          const isSelected = selectedModule === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => setSelectedModule(m.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.cardBg,
                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: colors.primary }]}
        onPress={handleResearch}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.submitBtnText}>Ask FINN to Analyze</Text>
        )}
      </TouchableOpacity>

      {/* Research Result Card */}
      {result && (
        <View style={[styles.resultBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.resultHeader}>
            <Text style={[styles.resultTicker, { color: colors.text }]}>{result.ticker}</Text>
          </View>
          <Text style={[styles.resultTitle, { color: colors.text }]}>{result.title}</Text>

          {/* Structured Ratios Pills */}
          {result.structured_data && Object.keys(result.structured_data).length > 0 && (
            <View style={styles.ratioGrid}>
              {Object.entries(result.structured_data).slice(0, 4).map(([k, v], idx) => (
                <View key={idx} style={[styles.ratioPill, { backgroundColor: colors.subtleBg }]}>
                  <Text style={[styles.ratioLabel, { color: colors.textMuted }]}>{k}</Text>
                  <Text style={[styles.ratioVal, { color: colors.text }]}>{String(v)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.summaryBox, { backgroundColor: colors.subtleBg }]}>
            <MarkdownRenderer
              content={result.summary}
              colors={{
                text: colors.text,
                textSecondary: colors.textSecondary,
                textMuted: colors.textMuted,
                primary: colors.primary,
                subtleBg: colors.subtleBg,
                cardBorder: colors.cardBorder,
              }}
            />
          </View>

          {result.sources && result.sources.length > 0 && (
            <>
              <Text style={[styles.sourceHeader, { color: colors.textMuted }]}>Primary Sources Verified:</Text>
              {result.sources.map((s, idx) => (
                <Text key={idx} style={[styles.sourceItem, { color: colors.textMuted }]}>• {s}</Text>
              ))}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 12,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
  },
  suggestionsDropdown: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  suggestionTicker: {
    fontSize: 14,
    fontWeight: '800',
  },
  suggestionSector: {
    fontSize: 10,
    fontWeight: '600',
  },
  suggestionName: {
    fontSize: 11,
  },
  chipHeader: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modelTag: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  modelTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  submitBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resultBox: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultTicker: {
    fontSize: 18,
    fontWeight: '800',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  ratioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  ratioPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    flex: 1,
    minWidth: '45%',
  },
  ratioLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  ratioVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  summaryContent: {
    fontSize: 13,
    lineHeight: 20,
  },
  sourceHeader: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  sourceItem: {
    fontSize: 11,
    marginBottom: 3,
  },
});
