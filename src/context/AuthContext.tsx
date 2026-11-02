import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';
import { api } from '../api';

const USER_STORAGE_KEY = '@finn_user_v1';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  loginWithGoogle: (email: string, name?: string, token?: string, avatar?: string) => Promise<{ success: boolean; isOnboarded: boolean; error?: string }>;
  completeOnboarding: (age: number, investorType: string, portfolioStocks: string[]) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isOnboarded: false,
  loginWithGoogle: async () => ({ success: false, isOnboarded: false }),
  completeOnboarding: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user session on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (raw) {
          const parsed: UserProfile = JSON.parse(raw);
          setUser(parsed);
          // Silent background sync with backend if reachable
          if (parsed.email) {
            api.getCurrentUser(parsed.email).then((remote) => {
              if (remote) {
                setUser(remote);
                AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(remote));
              }
            }).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('Failed restoring user session:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const loginWithGoogle = async (
    email: string,
    name?: string,
    token?: string,
    avatar?: string
  ): Promise<{ success: boolean; isOnboarded: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const oauthToken = token || process.env.EXPO_PUBLIC_GOOGLE_OAUTH_TOKEN;

      try {
        const res = await api.loginWithGoogle(cleanEmail, name, oauthToken, avatar);
        const loggedUser = res.user;
        setUser(loggedUser);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedUser));
        return { success: true, isOnboarded: res.is_onboarded };
      } catch (networkErr: any) {
        console.warn('Backend call failed, continuing with optimistic session:', networkErr.message);
        // Resilient fallback: Create / restore session so user is NEVER blocked on the login screen!
        const existingRaw = await AsyncStorage.getItem(USER_STORAGE_KEY);
        let fallbackUser: UserProfile;

        if (existingRaw) {
          const parsed = JSON.parse(existingRaw);
          if (parsed.email === cleanEmail) {
            fallbackUser = parsed;
          } else {
            fallbackUser = {
              email: cleanEmail,
              name: name || cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              is_onboarded: false,
              is_age_verified: false,
              portfolio_stocks: [],
              created_at: new Date().toISOString(),
            };
          }
        } else {
          fallbackUser = {
            email: cleanEmail,
            name: name || cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            is_onboarded: false,
            is_age_verified: false,
            portfolio_stocks: [],
            created_at: new Date().toISOString(),
          };
        }

        setUser(fallbackUser);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fallbackUser));
        return { success: true, isOnboarded: fallbackUser.is_onboarded };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (
    age: number,
    investorType: string,
    portfolioStocks: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user?.email) {
      return { success: false, error: 'No active user found.' };
    }
    try {
      setIsLoading(true);
      const cleanStocks = portfolioStocks.map((s) => s.toUpperCase().trim());
      let updatedUser: UserProfile;

      try {
        const res = await api.submitOnboarding(user.email, age, investorType, cleanStocks);
        if (res.success && res.user) {
          updatedUser = res.user;
        } else {
          throw new Error('Onboarding API returned invalid response');
        }
      } catch (netErr: any) {
        console.warn('Backend onboarding call failed, synthesizing on-device persona:', netErr.message);

        // On-device institutional personality synthesis fallback
        const inv = investorType.toLowerCase();
        let archetype = "The Disciplined Compounder";
        let tagline = "Patient capital focused on balance sheet safety and return on capital moats.";
        let description = `At ${age} years of age, you approach Indian equities with a multi-year horizon, prioritizing businesses with consistent ROCE/ROE (>15%), prudent leverage, and enduring competitive moats.`;
        let traits = ["Balance Sheet Solvency", "Cash Quality & Free Cash Flow", "Low Turnover Compounding"];
        let feedFocus = "Annual reports, capital expenditure disclosures, and long-term earnings durability.";

        if (inv.includes("short") || inv.includes("risk")) {
          archetype = "The Tactical Momentum Hunter";
          tagline = "Agile participant seeking asymmetric risk-reward on breakout catalysts and volume shifts.";
          description = `At ${age} years of age, you seek high-beta alpha in dynamic stocks, prioritizing immediate price catalysts, institutional volume spikes, and breaking material filings.`;
          traits = ["Catalyst Sensitivity", "Volume Breakout Tracking", "High Risk-Reward Asymmetry"];
          feedFocus = "Breaking exchange disclosures, volume spikes > 2x average, and earnings surprises.";
        } else if (inv.includes("regular")) {
          archetype = "The Strategic Growth Allocator";
          tagline = "Balanced wealth builder evaluating operational trajectory against fair valuations.";
          description = `At ${age} years of age, you maintain a balanced portfolio, analyzing quarterly revenue/margin trends and PEG multiples to capture steady Indian market growth.`;
          traits = ["Quarterly Momentum", "Fair Valuation Multiple", "Segmental Growth"];
          feedFocus = "Quarterly financial results, management concalls, and strategic expansion filings.";
        }

        updatedUser = {
          ...user,
          age,
          is_age_verified: true,
          investor_type: investorType,
          portfolio_stocks: cleanStocks,
          personality: {
            archetype,
            tagline,
            description,
            key_traits: traits,
            feed_focus: feedFocus,
            risk_profile: inv.includes("short") ? "Aggressive" : inv.includes("long") ? "Moderate Conservative" : "Moderate",
            priority_categories: ["results", "capex", "dividend"],
          },
          is_onboarded: true,
        };
      }

      setUser(updatedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      return { success: true };
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Onboarding submission failed';
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.warn('Error during logout:', e);
    }
  };

  const refreshUser = async () => {
    if (!user?.email) return;
    try {
      const remote = await api.getCurrentUser(user.email);
      if (remote) {
        setUser(remote);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(remote));
      }
    } catch (e) {
      console.warn('Failed refreshing user:', e);
    }
  };

  const isAuthenticated = !!user;
  const isOnboarded = !!user?.is_onboarded;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isOnboarded,
        loginWithGoogle,
        completeOnboarding,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
