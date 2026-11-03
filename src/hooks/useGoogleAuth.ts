/**
 * useGoogleAuth – Real Google OAuth via expo-auth-session
 *
 * Opens the Google account picker in a browser sheet. Works in:
 *   - Expo Go on Android/iOS (via Expo Auth Proxy)
 *   - Standalone APK / web build (finnmobile:// deep link)
 *
 * ── Google Cloud Console setup (one-time) ──────────────────────────────────
 * 1. Visit: https://console.cloud.google.com/apis/credentials
 * 2. Open your OAuth 2.0 Client ID → "Web application" type
 * 3. Under "Authorised redirect URIs" add ALL of these:
 *      https://auth.expo.io/@yashoct565/finn-mobile
 *      http://localhost:8081
 *      http://localhost:19006
 * 4. Save. Changes can take up to 5 minutes to propagate.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Completes the auth session when the redirect URL opens the app.
// Must be called at the module level (not inside a component).
WebBrowser.maybeCompleteAuthSession();

// The Web OAuth Client ID from Google Cloud Console
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
 * Fetches the user's Google profile via the UserInfo v2 endpoint.
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

/**
 * Hook — call at the top of a screen component.
 * Returns { request, response, signIn }.
 * Watch `response` in a useEffect to handle the result.
 */
export function useGoogleAuth() {
  // Google.useAuthRequest automatically sets up the Expo Auth Proxy
  // redirect URI for Expo Go and uses the native scheme for APK builds.
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID,
    selectAccount: true,   // Always show account picker — never auto-select
    scopes: ['openid', 'email', 'profile'],
    // redirectUri is intentionally omitted here: expo-auth-session resolves it
    // automatically per environment (proxy for Expo Go, scheme for APK).
  });

  const signIn = useCallback(async () => {
    if (!request) return;
    await promptAsync();
  }, [request, promptAsync]);

  return { request, response, signIn };
}

/**
 * Parses the raw AuthSession response into a typed GoogleAuthResult.
 * Use inside a useEffect that watches `response`.
 */
export async function parseGoogleResponse(
  response: ReturnType<typeof Google.useAuthRequest>[1]
): Promise<GoogleAuthResult> {
  if (!response) return { success: false, error: 'No response yet' };

  if (response.type === 'error') {
    const msg = (response as any).error?.message || JSON.stringify((response as any).error);
    return { success: false, error: `OAuth error: ${msg}` };
  }

  if (response.type === 'dismiss' || response.type === 'cancel') {
    // User closed the picker — not a real error, caller decides what to do
    return { success: false, error: 'cancelled' };
  }

  if (response.type === 'success') {
    const auth = (response as any).authentication;
    if (!auth?.accessToken) {
      return { success: false, error: 'Google did not return an access token' };
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
      return { success: false, error: e.message || 'Failed to load Google profile' };
    }
  }

  return { success: false, error: `Unexpected response type: ${response.type}` };
}
