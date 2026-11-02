import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from '../src/screens/LoginScreen';
import { OnboardingScreen } from '../src/screens/OnboardingScreen';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { isAuthenticated, isOnboarded, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 1. If not signed in with Google account: show Login Screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // 2. If signed in but first-time user: show Onboarding Wizard (Age + Investor Type + Stocks + AI Personality)
  if (!isOnboarded) {
    return <OnboardingScreen />;
  }

  // 3. User fully authenticated and onboarded: render main app tabs
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigation />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
