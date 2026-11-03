/**
 * useGoogleAuth – Real Google OAuth via expo-auth-session
 *
 * Uses the official Expo Auth Proxy (https://auth.expo.io/@yashoct565/finn-mobile)
 * with ResponseType.Token so Google receives an HTTPS redirect URI (satisfying
 * the strict requirement for Google Cloud "Web application" client type).
 */

import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';

// Completes the auth session when redirect URL opens
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '656488962423-0q9a8tonnl7q1eu5uq6nl7mechl24agt.apps.googleusercontent.com';

// Google "Web application" client type strictly forbids custom scheme URIs (like exp:// or finnmobile://)
// It requires an https:// redirect URI. For Expo apps, this is the Expo Auth Proxy URI:
const getRedirectUri = (): string => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081';
  }
  return 'https://auth.expo.io/@yashoct565/finn-mobile';
};

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
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Google UserInfo API error: ${resp.status} - ${errText}`);
  }
  return resp.json();
}

export function useGoogleAuth() {
  const redirectUri = getRedirectUri();

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID,
    responseType: ResponseType.Token,
    redirectUri: redirectUri,
    selectAccount: true,
    scopes: ['openid', 'email', 'profile'],
  });

  const signIn = useCallback(async () => {
    if (!request) return;
    await promptAsync();
  }, [request, promptAsync]);

  return { request, response, signIn };
}

/**
 * Parses the raw AuthSession response into a typed GoogleAuthResult.
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
    return { success: false, error: 'cancelled' };
  }

  if (response.type === 'success') {
    const accessToken =
      (response as any).authentication?.accessToken ||
      (response as any).params?.access_token;
    const idToken =
      (response as any).authentication?.idToken ||
      (response as any).params?.id_token;

    if (!accessToken) {
      return { success: false, error: 'Google did not return an access token' };
    }

    try {
      const profile = await fetchGoogleProfile(accessToken);
      return {
        success: true,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
        idToken: idToken || undefined,
        accessToken: accessToken,
      };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to load Google profile' };
    }
  }

  return { success: false, error: `Unexpected response: ${response.type}` };
}
