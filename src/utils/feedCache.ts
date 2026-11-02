import AsyncStorage from '@react-native-async-storage/async-storage';
import { FeedItem } from '../types';

const FEED_CACHE_KEY = '@finn_feed_cache_v2';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface CachedFeedEntry {
  item: FeedItem;
  cachedAt: number;
}

/**
 * Checks if a feed entry is within the 7-day retention window.
 */
function isWithin7Days(entry: CachedFeedEntry): boolean {
  const now = Date.now();
  if (now - entry.cachedAt > SEVEN_DAYS_MS) {
    return false;
  }

  // Also verify filed_at timestamp if parsable
  const filedDate = entry.item.announcement?.filed_at;
  if (filedDate) {
    const filedTime = new Date(filedDate).getTime();
    if (!isNaN(filedTime) && now - filedTime > SEVEN_DAYS_MS + 24 * 60 * 60 * 1000) {
      return false;
    }
  }

  return true;
}

/**
 * Loads cached feed items from AsyncStorage, automatically purging any items
 * that are older than 7 days.
 */
export async function getCachedFeed(): Promise<FeedItem[]> {
  try {
    const raw = await AsyncStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return [];

    const parsed: CachedFeedEntry[] = JSON.parse(raw);
    const validEntries = parsed.filter(isWithin7Days);

    // If any expired entries were purged, persist the cleaned list back
    if (validEntries.length !== parsed.length) {
      await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(validEntries));
    }

    return validEntries.map((e) => e.item);
  } catch (error) {
    console.warn('Error reading feed cache from AsyncStorage:', error);
    return [];
  }
}

/**
 * Merges freshly fetched feed items with the local cache, enforcing the
 * 7-day auto-purge retention rule.
 */
export async function saveFeedToCache(freshItems: FeedItem[]): Promise<FeedItem[]> {
  try {
    const now = Date.now();
    const raw = await AsyncStorage.getItem(FEED_CACHE_KEY);
    const existingEntries: CachedFeedEntry[] = raw ? JSON.parse(raw) : [];

    // Filter out expired items older than 7 days
    const validExisting = existingEntries.filter(isWithin7Days);

    // Build deduplication map by ticker + headline or announcement id
    const entryMap = new Map<string, CachedFeedEntry>();

    // Add existing valid entries
    for (const entry of validExisting) {
      const key = `${entry.item.announcement.ticker}_${entry.item.announcement.headline}`.trim();
      entryMap.set(key, entry);
    }

    // Upsert fresh entries
    for (const fresh of freshItems) {
      const key = `${fresh.announcement.ticker}_${fresh.announcement.headline}`.trim();
      entryMap.set(key, {
        item: fresh,
        cachedAt: now,
      });
    }

    const mergedEntries = Array.from(entryMap.values());

    // Sort: priority level (must-see first), then materiality score desc
    const priorityOrder: Record<string, number> = { 'must-see': 0, 'worth-knowing': 1, 'routine': 2 };
    mergedEntries.sort((a, b) => {
      const pA = priorityOrder[a.item.priority_level] ?? 3;
      const pB = priorityOrder[b.item.priority_level] ?? 3;
      if (pA !== pB) return pA - pB;
      return (b.item.announcement.materiality_score || 0) - (a.item.announcement.materiality_score || 0);
    });

    // Save back to AsyncStorage
    await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(mergedEntries));

    return mergedEntries.map((e) => e.item);
  } catch (error) {
    console.warn('Error saving feed to cache:', error);
    return freshItems;
  }
}

/**
 * Explicitly clears the entire local feed cache or purges expired items.
 */
export async function purgeExpiredFeedCache(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return;

    const parsed: CachedFeedEntry[] = JSON.parse(raw);
    const valid = parsed.filter(isWithin7Days);
    await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(valid));
  } catch (error) {
    console.warn('Error purging expired feed cache:', error);
  }
}

