/**
 * useGoogleAuth – Real Google OAuth via expo-auth-session
 *
 * Uses the official Expo Auth Proxy (https://auth.expo.io/@yashoct565/finn-mobile)
 * with ResponseType.Token and direct Google Discovery endpoint to guarantee
 * Google receives a valid HTTPS redirect URI (satisfying Google Cloud Web application client rules).
 */

import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest, ResponseType } from 'expo-auth-session';

// Completes the auth session when browser redirects back
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '656488962423-0q9a8tonnl7q1eu5uq6nl7mechl24agt.apps.googleusercontent.com';

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
};

// Must be an https:// URL registered in Google Cloud Console
export const REDIRECT_URI =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? window.location.origin
    : 'https://auth.expo.io/@yashoct565/finn-mobile';

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
 * Fetches user profile from Google's UserInfo API
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
    const err = await resp.text();
    throw new Error(`Google UserInfo API error (${resp.status}): ${err}`);
  }
  return resp.json();
}

export function useGoogleAuth() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: WEB_CLIENT_ID,
      responseType: ResponseType.Token,
      redirectUri: REDIRECT_URI,
      scopes: ['openid', 'email', 'profile'],
      usePKCE: false, // PKCE not needed for implicit token grant
      extraParams: {
        prompt: 'select_account',
      },
    },
    GOOGLE_DISCOVERY
  );

  const signIn = useCallback(async () => {
    if (!request) {
      console.warn('[FINN OAuth] Request is not loaded yet');
      return;
    }
    console.log('[FINN OAuth] Launching Google OAuth with redirectUri:', request.redirectUri);
    console.log('[FINN OAuth] Full Auth URL:', request.url);
    await promptAsync();
  }, [request, promptAsync]);

  return { request, response, signIn };
}

/**
 * Parses the raw AuthSession response into a typed GoogleAuthResult
 */
export async function parseGoogleResponse(
  response: any
): Promise<GoogleAuthResult> {
  if (!response) return { success: false, error: 'No response yet' };

  if (response.type === 'error') {
    const msg = response.error?.message || JSON.stringify(response.error);
    return { success: false, error: `Google OAuth error: ${msg}` };
  }

  if (response.type === 'dismiss' || response.type === 'cancel') {
    return { success: false, error: 'cancelled' };
  }

  if (response.type === 'success') {
    const accessToken =
      response.authentication?.accessToken ||
      response.params?.access_token;
    const idToken =
      response.authentication?.idToken ||
      response.params?.id_token;

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
        accessToken,
      };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to fetch Google profile' };
    }
  }

  return { success: false, error: `Unexpected response: ${response.type}` };
}
