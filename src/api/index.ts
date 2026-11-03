import axios from 'axios';
import { Company, FeedItem, ResearchOutput, AlertTriggered, UserProfile } from '../types';

// ── Single source of truth: the live Render backend ──────────────────────────
const getProductionBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL || 'https://finn-enam-backend.onrender.com/api';
  const clean = envUrl.trim().replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

// Axios instance — 45 s timeout to survive Render free-tier cold starts
export const apiClient = axios.create({
  baseURL: getProductionBaseUrl(),
  timeout: 45000,
});

// ── API surface ───────────────────────────────────────────────────────────────

export const api = {
  loginWithGoogle: async (
    email: string,
    name?: string,
    token?: string,
    avatar?: string
  ): Promise<{ user: UserProfile; is_onboarded: boolean; token: string }> => {
    const res = await apiClient.post('/auth/google', { email, name, token, avatar });
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
    } catch {
      return null;
    }
  },

  getAuthStatus: async (): Promise<any> => {
    try {
      const res = await apiClient.get('/auth/status');
      return res.data;
    } catch {
      return { mongodb_connected: false };
    }
  },

  getFeed: async (windowHours: number = 24, email?: string): Promise<FeedItem[]> => {
    try {
      let url = `/feed?window_hours=${windowHours}`;
      if (email) url += `&email=${encodeURIComponent(email)}`;
      const res = await apiClient.get<FeedItem[]>(url);
      return res.data;
    } catch (e) {
      console.warn('Feed call failed:', e);
      return [];
    }
  },

  getPortfolio: async (email?: string): Promise<Company[]> => {
    try {
      const url = email ? `/portfolio?email=${encodeURIComponent(email)}` : '/portfolio';
      const res = await apiClient.get<Company[]>(url);
      return res.data;
    } catch (e) {
      console.warn('Portfolio call failed:', e);
      return [];
    }
  },

  addStock: async (ticker: string, name?: string, email?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post('/portfolio', { ticker, name: name || ticker, email });
      return { success: true };
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Network error';
      return { success: false, error: msg };
    }
  },

  removeStock: async (ticker: string, email?: string): Promise<boolean> => {
    try {
      const url = email ? `/portfolio/${ticker}?email=${encodeURIComponent(email)}` : `/portfolio/${ticker}`;
      await apiClient.delete(url);
      return true;
    } catch {
      return false;
    }
  },

  getAlerts: async (): Promise<AlertTriggered[]> => {
    try {
      const res = await apiClient.get<AlertTriggered[]>('/alerts/triggered');
      return res.data;
    } catch {
      return [];
    }
  },

  performResearch: async (ticker: string, module: string, query?: string): Promise<ResearchOutput> => {
    const res = await apiClient.post<ResearchOutput>('/research', { ticker, module, query });
    return res.data;
  },
};
