/**
 * useGoogleAuth – Real Google OAuth via expo-auth-session
 *
 * Opens the native Google account picker / browser-based sign-in flow.
 * Works in:
 *   - Expo Go (web redirect via Expo auth proxy)
 *   - Standalone APK / web build (finnmobile:// deep link)
 *
 * Google Cloud Console setup:
 *   1. Go to https://console.cloud.google.com/apis/credentials
 *   2. Create (or use existing) OAuth 2.0 Client ID → "Web application"
 *   3. Add Authorised redirect URI:
 *        https://auth.expo.io/@<your-expo-username>/finn-mobile
 *   4. Copy the Client ID into EXPO_PUBLIC_GOOGLE_CLIENT_ID in .env
 */

import { useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

// IMPORTANT: This call must be at module top-level so the browser session
// is completed when the redirect URL is opened by the OS.
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

export interface GoogleAuthResult {
  success: boolean;
  email?: string;
  name?: string;
  avatar?: string;
  idToken?: string;
  accessToken?: string;
  error?: string;
}

/**
 * Fetches the user's Google profile using the access token.
 */
async function fetchGoogleProfile(accessToken: string): Promise<{
  email: string;
  name: string;
  picture: string;
}> {
  const resp = await fetch('https://www.googleapis.com/userinfo/v2/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) throw new Error('Failed to fetch Google profile');
  return resp.json();
}

export function useGoogleAuth() {
  // useAuthRequest from the Google provider handles discovery automatically.
  // redirectUriOptions: pass `scheme` for native/standalone APKs.
  // For Expo Go on Android, the Expo auth proxy redirect is used by default.
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      clientId: WEB_CLIENT_ID,  // Web client ID (works in Expo Go + web)
      selectAccount: true,       // Always show the account picker
      scopes: ['openid', 'email', 'profile'],
    },
    {
      // The scheme 'finnmobile' is defined in app.json — handles redirect in APK builds.
      // In Expo Go the library falls back to the Expo proxy automatically.
      scheme: 'finnmobile',
    }
  );

  const signIn = useCallback(async () => {
    if (!request) return;
    await promptAsync();
  }, [request, promptAsync]);

  return { request, response, signIn };
}

/**
 * Parses the auth-session response into a clean GoogleAuthResult.
 * Call this inside a useEffect watching `response`.
 */
export async function parseGoogleResponse(
  response: ReturnType<typeof Google.useAuthRequest>[1]
): Promise<GoogleAuthResult> {
  if (!response) return { success: false, error: 'No response yet' };

  if (response.type === 'error') {
    return { success: false, error: (response as any).error?.message || 'Google sign-in error' };
  }

  if (response.type === 'dismiss' || response.type === 'cancel') {
    return { success: false, error: 'Sign-in cancelled' };
  }

  if (response.type === 'success') {
    const auth = (response as any).authentication;
    if (!auth?.accessToken) {
      return { success: false, error: 'No access token returned from Google' };
    }
    try {
      const profile = await fetchGoogleProfile(auth.accessToken);
      return {
        success: true,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
        idToken: auth.idToken ?? undefined,
        accessToken: auth.accessToken,
      };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch Google profile' };
    }
  }

  return { success: false, error: `Unexpected OAuth response: ${response.type}` };
}
