import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Company, FeedItem, ResearchOutput, AlertTriggered, UserProfile } from '../types';

const CUSTOM_API_URL_KEY = '@finn_custom_api_url';

const PRODUCTION_RENDER_URL = 'https://finn-enam-backend.onrender.com/api';

/**
 * Dynamically resolves the API base URL:
 * 1. Checks explicit EXPO_PUBLIC_API_URL environment variable (from .env or build)
 * 2. If running in Expo Go, extracts LAN host IP (e.g. 172.23.70.244)
 * 3. Default in Standalone / Production APK to the live Render backend
 */
const getDefaultBaseUrl = (): string => {
  // 1. Explicit production / Render URL from .env
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.startsWith('http') && !envUrl.includes('localhost')) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  // 2. In Expo Go, auto-detect development host
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000/api`;
    }
  }

  // 3. Default to live Render backend
  return PRODUCTION_RENDER_URL;
};

export const apiClient = axios.create({
  baseURL: getDefaultBaseUrl(),
  timeout: 12000,
});

// Restore custom API URL from AsyncStorage if previously configured
AsyncStorage.getItem(CUSTOM_API_URL_KEY).then((saved) => {
  if (saved && saved.startsWith('http')) {
    apiClient.defaults.baseURL = saved.endsWith('/api') ? saved : `${saved}/api`;
    console.log('[FINN Mobile] Restored custom backend URL:', apiClient.defaults.baseURL);
  }
}).catch(() => {});

export const setBackendUrl = async (url: string): Promise<{ success: boolean; error?: string }> => {
  let cleanUrl = url.trim().replace(/\/+$/, '');
  // Auto-correct single 'n' typo to 'finn-enam-backend'
  if (cleanUrl.includes('fin-enam-backend') && !cleanUrl.includes('finn-enam-backend')) {
    cleanUrl = cleanUrl.replace('fin-enam-backend', 'finn-enam-backend');
  }
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  const apiUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

  try {
    const testClient = axios.create({ baseURL: apiUrl, timeout: 8000 });
    const res = await testClient.get('/auth/status');
    if (res.status === 200) {
      apiClient.defaults.baseURL = apiUrl;
      await AsyncStorage.setItem(CUSTOM_API_URL_KEY, apiUrl);
      return { success: true };
    }
    return { success: false, error: `Server responded with status ${res.status}` };
  } catch (e: any) {
    return { success: false, error: e.message || 'Could not connect to specified URL' };
  }
};

export const getEffectiveBaseUrl = (): string => {
  return apiClient.defaults.baseURL || getDefaultBaseUrl();
};

export const api = {
  loginWithGoogle: async (
    email: string,
    name?: string,
    token?: string,
    avatar?: string
  ): Promise<{ user: UserProfile; is_onboarded: boolean; token: string }> => {
    const res = await apiClient.post('/auth/google', {
      email,
      name,
      token,
      avatar,
    });
    return res.data;
  },

  submitOnboarding: async (
    email: string,
    age: number,
    investorType: string,
    portfolioStocks: string[]
  ): Promise<{ success: boolean; user: UserProfile; message?: string }> => {
    const res = await apiClient.post('/auth/onboarding', {
      email,
      age,
      investor_type: investorType,
      portfolio_stocks: portfolioStocks,
    });
    return res.data;
  },

  getCurrentUser: async (email: string): Promise<UserProfile | null> => {
    try {
      const res = await apiClient.get<UserProfile>(`/auth/me?email=${encodeURIComponent(email)}`);
      return res.data;
    } catch (e) {
      return null;
    }
  },

  getAuthStatus: async (): Promise<any> => {
    try {
      const res = await apiClient.get('/auth/status');
      return res.data;
    } catch (e) {
      return { mongodb_connected: false };
    }
  },

  getFeed: async (windowHours: number = 24, email?: string): Promise<FeedItem[]> => {
    try {
      let url = `/feed?window_hours=${windowHours}`;
      if (email) {
        url += `&email=${encodeURIComponent(email)}`;
      }
      const res = await apiClient.get<FeedItem[]>(url);
      return res.data;
    } catch (e) {
      console.warn('Backend feed call failed:', e);
      return [];
    }
  },

  getPortfolio: async (email?: string): Promise<Company[]> => {
    try {
      const url = email ? `/portfolio?email=${encodeURIComponent(email)}` : '/portfolio';
      const res = await apiClient.get<Company[]>(url);
      return res.data;
    } catch (e) {
      console.warn('Backend portfolio call failed:', e);
      return [];
    }
  },

  addStock: async (ticker: string, name?: string, email?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post('/portfolio', { ticker, name: name || ticker, email });
      return { success: true };
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Network error';
      console.error('Error adding stock:', msg);
      return { success: false, error: msg };
    }
  },

  removeStock: async (ticker: string, email?: string): Promise<boolean> => {
    try {
      const url = email ? `/portfolio/${ticker}?email=${encodeURIComponent(email)}` : `/portfolio/${ticker}`;
      await apiClient.delete(url);
      return true;
    } catch (e) {
      console.error('Error removing stock:', e);
      return false;
    }
  },

  getAlerts: async (): Promise<AlertTriggered[]> => {
    try {
      const res = await apiClient.get<AlertTriggered[]>('/alerts/triggered');
      return res.data;
    } catch (e) {
      return [];
    }
  },

  performResearch: async (ticker: string, module: string, query?: string): Promise<ResearchOutput> => {
    const res = await apiClient.post<ResearchOutput>('/research', {
      ticker,
      module,
      query,
    });
    return res.data;
  },
};
