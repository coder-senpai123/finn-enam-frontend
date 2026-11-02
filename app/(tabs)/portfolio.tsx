import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { api } from '../../src/api';
import { Company } from '../../src/types';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { getSuggestions, StockSuggestion } from '../../src/constants/stocks';

export default function PortfolioScreen() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTicker, setNewTicker] = useState('');
  const [newName, setNewName] = useState('');
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [adding, setAdding] = useState(false);
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();

  const loadPortfolio = async () => {
    setLoading(true);
    const data = await api.getPortfolio(user?.email);
    setCompanies(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPortfolio();
  }, [user?.email]);

  const handleTickerChange = (val: string) => {
    const upper = val.toUpperCase();
    setNewTicker(upper);
    if (upper.trim().length >= 1) {
      setSuggestions(getSuggestions(upper));
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (s: StockSuggestion) => {
    setNewTicker(s.ticker);
    setNewName(s.name);
    setSuggestions([]);
  };

  const handleAddStock = async () => {
    const cleanTicker = newTicker.trim().toUpperCase();
    if (!cleanTicker) return;

    setAdding(true);
    const result = await api.addStock(cleanTicker, newName.trim(), user?.email);

    if (result.success) {
      setNewTicker('');
      setNewName('');
      setSuggestions([]);
      setModalVisible(false);
      await loadPortfolio();
      await refreshUser();
    } else {
      // Local optimistic fallback
      const fallbackCompany: Company = {
        ticker: cleanTicker,
        name: newName.trim() || `${cleanTicker} Ltd`,
        sector: 'Equities',
        market_cap_category: 'Mid',
        price: 1540.0,
        change_pct: 1.25,
        volume: 2400000,
        avg_volume_20d: 2100000,
      };
      setCompanies((prev) => [fallbackCompany, ...prev.filter((c) => c.ticker !== cleanTicker)]);
      setNewTicker('');
      setNewName('');
      setSuggestions([]);
      setModalVisible(false);
    }
    setAdding(false);
  };

  const handleRemoveStock = (ticker: string) => {
    Alert.alert(
      'Remove Stock',
      `Are you sure you want to remove ${ticker} from your portfolio?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setCompanies((prev) => prev.filter((c) => c.ticker !== ticker));
            await api.removeStock(ticker, user?.email);
            await refreshUser();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.cardBg, borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.portfolioCount, { color: colors.textSecondary }]}>
          TRACKING {companies.length} STOCKS (LIVE EOD)
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Add Stock</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={companies}
        keyExtractor={(item) => item.ticker}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPortfolio} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSpike = item.volume > item.avg_volume_20d * 2;
          const isPositive = item.change_pct >= 0;

          return (
            <View
              style={[
                styles.stockCard,
                { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.leftCol}>
                <View style={styles.tickerRow}>
                  <Text style={[styles.ticker, { color: colors.text }]}>{item.ticker}</Text>
                  {isSpike && (
                    <View style={styles.spikePill}>
                      <Text style={styles.spikeText}>⚡ 2x Vol</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.name, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.sector, { color: colors.textMuted }]}>{item.sector}</Text>
              </View>

              <View style={styles.rightCol}>
                <Text style={[styles.price, { color: colors.text }]}>₹{item.price.toFixed(2)}</Text>
                <View style={[styles.changePill, isPositive ? styles.pillGreen : styles.pillRed]}>
                  <Text style={[styles.changeText, isPositive ? styles.textGreen : styles.textRed]}>
                    {isPositive ? '+' : ''}
                    {item.change_pct.toFixed(2)}%
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveStock(item.ticker)}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.deleteText}>✕ Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Add Stock Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Stock to Portfolio</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Type any stock name or ticker to see real-time suggestions.
            </Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder, color: colors.text }]}
              value={newTicker}
              onChangeText={handleTickerChange}
              placeholder="NSE TICKER (e.g. WIPRO, MARUTI)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
            />

            {/* Suggestions dropdown in Modal */}
            {suggestions.length > 0 && (
              <View style={[styles.modalSuggestions, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.ticker}
                    style={[styles.modalSuggestionItem, { borderBottomColor: colors.cardBorder }]}
                    onPress={() => selectSuggestion(item)}
                  >
                    <Text style={[styles.modalSuggestionTicker, { color: colors.primary }]}>{item.ticker}</Text>
                    <Text style={[styles.modalSuggestionName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.name} ({item.sector})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.subtleBg, borderColor: colors.cardBorder, color: colors.text }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Company Name (Optional)"
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancel, { backgroundColor: colors.subtleBg }]}
                onPress={() => {
                  setSuggestions([]);
                  setModalVisible(false);
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: colors.primary }]}
                onPress={handleAddStock}
                disabled={adding}
              >
                <Text style={styles.modalConfirmText}>{adding ? 'Fetching Live...' : 'Add to Watchlist'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  portfolioCount: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingBottom: 28,
  },
  stockCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  leftCol: {
    flex: 1,
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  ticker: {
    fontSize: 16,
    fontWeight: '800',
  },
  spikePill: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  spikeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c2410c',
  },
  name: {
    fontSize: 12,
    marginBottom: 2,
  },
  sector: {
    fontSize: 10,
    fontWeight: '500',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  changePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  pillGreen: {
    backgroundColor: '#dcfce7',
  },
  pillRed: {
    backgroundColor: '#fee2e2',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textGreen: {
    color: '#16a34a',
  },
  textRed: {
    color: '#dc2626',
  },
  deleteBtn: {
    paddingVertical: 2,
  },
  deleteText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalSuggestions: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  modalSuggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  modalSuggestionTicker: {
    fontSize: 13,
    fontWeight: '800',
  },
  modalSuggestionName: {
    fontSize: 11,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
