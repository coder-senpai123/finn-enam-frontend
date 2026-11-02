import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { api } from '../../src/api';
import { FeedItem } from '../../src/types';
import { FeedCard } from '../../src/components/feed/FeedCard';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { getCachedFeed, saveFeedToCache, purgeExpiredFeedCache } from '../../src/utils/feedCache';

export default function FeedScreen() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [windowHours, setWindowHours] = useState(24);
  const [showRoutine, setShowRoutine] = useState(false);
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  // Load local 7-day cache on initial mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      // 1. Purge expired entries older than 7 days
      await purgeExpiredFeedCache();
      // 2. Load valid cached items immediately
      const cached = await getCachedFeed();
      if (isMounted && cached.length > 0) {
        setFeed(cached);
      }
      // 3. Fetch fresh feed in background
      loadFeed(false);
    })();
    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  const loadFeed = useCallback(async (showLoadingSpinner: boolean = true) => {
    if (showLoadingSpinner) setLoading(true);
    try {
      const data = await api.getFeed(windowHours, user?.email);
      if (data && data.length > 0) {
        // Merge fresh items into 7-day local cache and auto-purge old items
        const merged = await saveFeedToCache(data);
        setFeed(merged);
      } else {
        const cached = await getCachedFeed();
        if (cached.length > 0) {
          setFeed(cached);
        }
      }
    } catch (e) {
      console.warn('Network error fetching live feed, falling back to 7-day local cache:', e);
      const cached = await getCachedFeed();
      if (cached.length > 0) {
        setFeed(cached);
      }
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  }, [windowHours, user?.email]);

  useEffect(() => {
    loadFeed(true);
  }, [windowHours, user?.email]);

  const mustSeeItems = feed.filter((i) => i.priority_level === 'must-see');
  const worthKnowingItems = feed.filter((i) => i.priority_level === 'worth-knowing');
  const routineItems = feed.filter((i) => i.priority_level === 'routine');

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Time Window Selector (Up to 7 Days Retention) */}
      <View style={[styles.windowBar, { backgroundColor: colors.cardBg, borderBottomColor: colors.cardBorder }]}>
        <Text style={[styles.windowLabel, { color: colors.textMuted }]}>WINDOW:</Text>
        {[24, 48, 168].map((h) => (
          <TouchableOpacity
            key={h}
            onPress={() => setWindowHours(h)}
            style={[
              styles.timePill,
              { backgroundColor: colors.subtleBg },
              windowHours === h && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: colors.textSecondary },
                windowHours === h && styles.activePillText,
              ]}
            >
              {h === 168 ? '7 Days' : `${h}h`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={[...mustSeeItems, ...worthKnowingItems, ...(showRoutine ? routineItems : [])]}
        keyExtractor={(item, index) => `${item.announcement.ticker}_${item.announcement.id || index}`}
        renderItem={({ item }) => <FeedCard item={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => loadFeed(true)} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          user?.personality ? (
            <View style={[styles.personaBanner, { backgroundColor: isDark ? '#141d2b' : '#f0fdf4', borderColor: colors.cardBorder }]}>
              <View style={styles.personaBannerTop}>
                <View style={styles.personaBadgePill}>
                  <Text style={styles.personaBadgeText}>
                    🎯 {user.personality.archetype}
                  </Text>
                </View>
                <Text style={[styles.personaUserStyle, { color: colors.primary }]}>
                  {user.investor_type || 'Investor'}
                </Text>
              </View>
              <Text style={[styles.personaTagline, { color: colors.text }]}>
                "{user.personality.tagline}"
              </Text>
              <Text style={[styles.personaFocus, { color: colors.textSecondary }]}>
                Feed calibrated for {user.name}: {user.personality.feed_focus}
              </Text>
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Filings Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Pull down to refresh or check your portfolio watchlist.
              </Text>
            </View>
          ) : undefined
        }
        ListFooterComponent={
          routineItems.length > 0 && !showRoutine ? (
            <TouchableOpacity
              style={[styles.routineToggle, { backgroundColor: colors.subtleBg }]}
              onPress={() => setShowRoutine(true)}
            >
              <Text style={[styles.routineText, { color: colors.textSecondary }]}>
                ▾ Show {routineItems.length} collapsed routine filings
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  windowBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  windowLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginRight: 4,
  },
  timePill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activePillText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  personaBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  personaBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  personaBadgePill: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  personaBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  personaUserStyle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  personaTagline: {
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 4,
  },
  personaFocus: {
    fontSize: 11,
    lineHeight: 15,
  },
  routineToggle: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  routineText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
});
