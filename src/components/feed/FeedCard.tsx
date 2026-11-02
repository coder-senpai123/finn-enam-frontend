import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { FeedItem } from '../../types';
import { Badge } from '../common/Badge';
import { useTheme } from '../../context/ThemeContext';

export const FeedCard: React.FC<{ item: FeedItem }> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const { announcement, priority_level } = item;
  const { colors, isDark } = useTheme();

  let enrichment: any = null;
  if (announcement.enrichment_json) {
    try {
      enrichment = typeof announcement.enrichment_json === 'string'
        ? JSON.parse(announcement.enrichment_json)
        : announcement.enrichment_json;
    } catch (e) {
      enrichment = null;
    }
  }

  const handleOpenSource = () => {
    const url = enrichment?.source_url || announcement.source_url;
    if (url) {
      Linking.openURL(url).catch((err) => console.warn('Could not open URL:', err));
    }
  };

  // Verdict badge colors
  const getVerdictStyle = (verdict: string = '') => {
    const v = verdict.toUpperCase();
    if (v.includes('WORTH CONSIDERING') || v.includes('BULLISH')) {
      return {
        bg: isDark ? '#064e3b' : '#d1fae5',
        border: '#10b981',
        text: isDark ? '#6ee7b7' : '#065f46',
        icon: '✓',
      };
    } else if (v.includes('CAUTION') || v.includes('HIGH RISK') || v.includes('BEARISH')) {
      return {
        bg: isDark ? '#450a0a' : '#fee2e2',
        border: '#ef4444',
        text: isDark ? '#fca5a5' : '#991b1b',
        icon: '⚠',
      };
    }
    // Balanced / Wait & Watch
    return {
      bg: isDark ? '#451a03' : '#fef3c7',
      border: '#f59e0b',
      text: isDark ? '#fcd34d' : '#92400e',
      icon: '⚖',
    };
  };

  const verdictStyle = enrichment?.verdict ? getVerdictStyle(enrichment.verdict) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setExpanded(!expanded)}
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBg,
          borderColor: priority_level === 'must-see' ? '#ef4444' : colors.cardBorder,
        },
        priority_level === 'must-see' && styles.cardMustSee,
      ]}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Badge label={announcement.category.replace('_', ' ')} variant={priority_level} />
          <Text style={[styles.ticker, { color: colors.text }]}>{announcement.ticker}</Text>
        </View>
        <Text style={[styles.priorityText, { color: colors.textMuted }]}>
          {priority_level.replace('-', ' ')}
        </Text>
      </View>

      {/* Main Headline */}
      <Text style={[styles.headline, { color: colors.text }]}>{announcement.headline}</Text>

      {/* Dynamic AI Summary */}
      {announcement.ai_summary ? (
        <View style={[styles.summaryContainer, { backgroundColor: colors.subtleBg }]}>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryLabel, { color: colors.primary }]}>⚡ AI Summary:</Text>
            {announcement.filed_at && (
              <Text style={[styles.filedDate, { color: colors.textMuted }]}>
                {announcement.filed_at}
              </Text>
            )}
          </View>
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
            {announcement.ai_summary}
          </Text>
        </View>
      ) : null}

      {/* Progressive Disclosure: Rich Deep Data on Tap */}
      {expanded && (
        <View style={[styles.expandedContainer, { backgroundColor: isDark ? '#141d2b' : '#f8fafc', borderColor: colors.cardBorder }]}>
          {/* 1. Investment Viability Verdict */}
          {enrichment && enrichment.verdict && verdictStyle && (
            <View style={styles.verdictSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  INVESTMENT VIABILITY VERDICT
                </Text>
              </View>

              {/* Core Verdict Pill */}
              <View style={[styles.verdictPill, { backgroundColor: verdictStyle.bg, borderColor: verdictStyle.border }]}>
                <Text style={[styles.verdictIcon, { color: verdictStyle.text }]}>{verdictStyle.icon}</Text>
                <Text style={[styles.verdictText, { color: verdictStyle.text }]}>
                  {enrichment.verdict}
                </Text>
              </View>

              {/* Verdict Reason / Core Investment Answer */}
              {enrichment.verdict_reason && (
                <Text style={[styles.verdictReason, { color: colors.text }]}>
                  "{enrichment.verdict_reason}"
                </Text>
              )}

              {/* Personalized Lens for User's Personality */}
              {enrichment.personalized_lens && (
                <View style={[styles.lensBox, { backgroundColor: colors.subtleBg }]}>
                  <Text style={[styles.lensText, { color: colors.primary }]}>
                    🎯 {enrichment.personalized_lens}
                  </Text>
                </View>
              )}

              {/* Key Financial Ratios Chip Row */}
              {enrichment.ratios && Object.keys(enrichment.ratios).length > 0 && (
                <View style={styles.ratiosGrid}>
                  {Object.entries(enrichment.ratios).map(([metric, val]: any) => (
                    val && val !== 'N/A' ? (
                      <View key={metric} style={[styles.ratioChip, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.ratioLabel, { color: colors.textMuted }]}>{metric}</Text>
                        <Text style={[styles.ratioVal, { color: colors.text }]}>{val}</Text>
                      </View>
                    ) : null
                  ))}
                </View>
              )}

              {/* 4 Pillars of Evaluation */}
              <View style={styles.pillarsContainer}>
                {enrichment.financial_health && (
                  <View style={styles.pillarItem}>
                    <Text style={[styles.pillarLabel, { color: colors.primary }]}>🛡️ Financial Health & Solvency:</Text>
                    <Text style={[styles.pillarText, { color: colors.textSecondary }]}>
                      {enrichment.financial_health}
                    </Text>
                  </View>
                )}

                {enrichment.growth_potential && (
                  <View style={styles.pillarItem}>
                    <Text style={[styles.pillarLabel, { color: colors.primary }]}>🚀 Growth Potential & Catalysts:</Text>
                    <Text style={[styles.pillarText, { color: colors.textSecondary }]}>
                      {enrichment.growth_potential}
                    </Text>
                  </View>
                )}

                {enrichment.valuation_check && (
                  <View style={styles.pillarItem}>
                    <Text style={[styles.pillarLabel, { color: colors.primary }]}>💰 Valuation Check:</Text>
                    <Text style={[styles.pillarText, { color: colors.textSecondary }]}>
                      {enrichment.valuation_check}
                    </Text>
                  </View>
                )}

                {enrichment.key_risk && (
                  <View style={styles.pillarItem}>
                    <Text style={[styles.pillarLabel, { color: '#ef4444' }]}>⚠️ Key Risk to Justify:</Text>
                    <Text style={[styles.pillarText, { color: colors.textSecondary }]}>
                      {enrichment.key_risk}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Legacy Quarterly Results Table if present */}
          {enrichment && enrichment.type === 'results' && enrichment.metrics && (
            <View style={styles.tableSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Quarterly Financial Performance ({enrichment.quarter || 'Reported'})
              </Text>
              <View style={[styles.tableHeader, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.col, styles.colHead, { color: colors.textMuted }]}>Metric</Text>
                <Text style={[styles.col, styles.colHead, { color: colors.textMuted }]}>Value</Text>
                <Text style={[styles.col, styles.colHead, { color: colors.textMuted }]}>QoQ</Text>
                <Text style={[styles.col, styles.colHead, { color: colors.textMuted }]}>YoY</Text>
              </View>
              {enrichment.metrics.map((m: any, idx: number) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.col, { color: colors.textSecondary }]}>{m.name}</Text>
                  <Text style={[styles.col, styles.bold, { color: colors.text }]}>{m.val}</Text>
                  <Text style={[styles.col, (m.qoq || '').includes('+') ? styles.green : styles.red]}>{m.qoq || '-'}</Text>
                  <Text style={[styles.col, (m.yoy || '').includes('+') ? styles.green : styles.red]}>{m.yoy || '-'}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Primary Source Filing Link Button */}
          {(enrichment?.source_url || announcement.source_url) && (
            <TouchableOpacity
              style={[styles.sourceButton, { borderColor: colors.primary }]}
              onPress={handleOpenSource}
            >
              <Text style={[styles.sourceButtonText, { color: colors.primary }]}>
                📄 View Official Exchange Filing (BSE/NSE) ↗
              </Text>
            </TouchableOpacity>
          )}

          {/* Small Mandatory AI Disclaimer */}
          <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
            AI is prone to mistakes; trust your judgement first.
          </Text>
        </View>
      )}

      {/* Expand / Collapse Footer Prompt */}
      <View style={styles.footer}>
        <Text style={[styles.tapPrompt, { color: colors.primary }]}>
          {expanded ? '▲ Tap to collapse' : '▼ Tap to expand analysis & investment verdict'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardMustSee: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticker: {
    fontSize: 14,
    fontWeight: '800',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 8,
  },
  summaryContainer: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  filedDate: {
    fontSize: 10,
    fontWeight: '500',
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 18,
  },
  expandedContainer: {
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    marginBottom: 8,
    borderWidth: 1,
  },
  verdictSection: {
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verdictPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    gap: 6,
  },
  verdictIcon: {
    fontSize: 13,
    fontWeight: '800',
  },
  verdictText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  verdictReason: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  lensBox: {
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  lensText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  ratiosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  ratioChip: {
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 80,
  },
  ratioLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ratioVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  pillarsContainer: {
    gap: 8,
  },
  pillarItem: {
    marginBottom: 2,
  },
  pillarLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  pillarText: {
    fontSize: 12,
    lineHeight: 17,
  },
  tableSection: {
    marginVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
  },
  col: {
    flex: 1,
    fontSize: 11,
  },
  colHead: {
    fontWeight: '700',
  },
  bold: {
    fontWeight: '600',
  },
  green: {
    color: '#16a34a',
    fontWeight: '600',
  },
  red: {
    color: '#dc2626',
    fontWeight: '600',
  },
  sourceButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  sourceButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
  footer: {
    marginTop: 6,
    alignItems: 'center',
  },
  tapPrompt: {
    fontSize: 11,
    fontWeight: '700',
  },
});
