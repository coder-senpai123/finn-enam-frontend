import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Company, FeedItem, ResearchOutput, AlertTriggered, UserProfile } from '../types';

/**
 * Dynamically resolves the API base URL depending on device environment:
 * - On Physical Phone (Expo Go): uses the debuggerHost / hostUri LAN IP (e.g. 172.23.70.244)
 * - On Android Emulator: uses 10.0.2.2 (alias to host loopback)
 * - On Web / iOS Simulator: uses localhost
 */
const getBaseUrl = (): string => {
  // If running in Expo Go, extract the computer's LAN IP automatically
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

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }

  // Fallback to computer's current Wi-Fi LAN IP
  return 'http://172.23.70.244:8000/api';
};

const API_BASE_URL = getBaseUrl();
console.log('[FINN Mobile] Connecting to backend at:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

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
