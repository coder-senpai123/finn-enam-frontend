import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  isDark: boolean;
  bg: string;
  cardBg: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  subtleBg: string;
  headerBg: string;
  tabBarBg: string;
  tabBarBorder: string;
  primary: string;
  accent: string;
  danger: string;
  success: string;
}

const lightTheme: ThemeColors = {
  isDark: false,
  bg: '#f8fafc',
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#64748b',
  subtleBg: '#f1f5f9',
  headerBg: '#ffffff',
  tabBarBg: '#ffffff',
  tabBarBorder: '#e2e8f0',
  primary: '#0284c7',
  accent: '#0f172a',
  danger: '#ef4444',
  success: '#16a34a',
};

const darkTheme: ThemeColors = {
  isDark: true,
  bg: '#090d16',
  cardBg: '#131b2e',
  cardBorder: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  subtleBg: '#1a243b',
  headerBg: '#0f172a',
  tabBarBg: '#0f172a',
  tabBarBorder: '#1e293b',
  primary: '#38bdf8',
  accent: '#38bdf8',
  danger: '#f87171',
  success: '#4ade80',
};

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  isDark: false,
  colors: lightTheme,
  toggleTheme: () => {},
  setMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceScheme = useDeviceColorScheme();
  const [mode, setMode] = useState<ThemeMode>('light');

  const isDark = mode === 'system' ? deviceScheme === 'dark' : mode === 'dark';
  const colors = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark, colors, toggleTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

