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
          // Try background sync with backend
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
      const oauthToken = token || process.env.EXPO_PUBLIC_GOOGLE_OAUTH_TOKEN;
      const res = await api.loginWithGoogle(email, name, oauthToken, avatar);
      const loggedUser = res.user;
      setUser(loggedUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedUser));
      return { success: true, isOnboarded: res.is_onboarded };
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Login failed';
      return { success: false, isOnboarded: false, error: msg };
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
      const res = await api.submitOnboarding(user.email, age, investorType, portfolioStocks);
      if (res.success && res.user) {
        setUser(res.user);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, error: 'Onboarding failed.' };
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

