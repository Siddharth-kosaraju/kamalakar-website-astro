/**
 * Minimal Cognito auth client — no SDK dependency, just fetch calls to the
 * Cognito IDP API (InitiateAuth with USER_PASSWORD_AUTH, over HTTPS). See
 * infra/lib/media-cms-stack.ts for why USER_PASSWORD_AUTH was chosen over
 * SRP (avoids a client-side crypto dependency for a small trusted team).
 */

const REGION = import.meta.env.PUBLIC_COGNITO_REGION || '';
const CLIENT_ID = import.meta.env.PUBLIC_COGNITO_CLIENT_ID || '';
const IDP_ENDPOINT = REGION ? `https://cognito-idp.${REGION}.amazonaws.com/` : '';

export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

const STORAGE_KEY = 'kamalakar-admin-auth';

async function idpFetch(target: string, body: object) {
  const res = await fetch(IDP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.__type || 'Authentication failed');
  }
  return data;
}

export function isConfigured(): boolean {
  return Boolean(REGION && CLIENT_ID);
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const data = await idpFetch('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });

  if (data.ChallengeName) {
    throw new Error(
      data.ChallengeName === 'NEW_PASSWORD_REQUIRED'
        ? 'This account needs a password reset before first login — ask an admin to resend an invite.'
        : `Unsupported login challenge: ${data.ChallengeName}`
    );
  }

  const result = data.AuthenticationResult;
  const tokens: AuthTokens = {
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    refreshToken: result.RefreshToken,
    expiresAt: Date.now() + result.ExpiresIn * 1000,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  return tokens;
}

export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const data = await idpFetch('InitiateAuth', {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  });
  const result = data.AuthenticationResult;
  const tokens: AuthTokens = {
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    refreshToken, // not reissued on refresh
    expiresAt: Date.now() + result.ExpiresIn * 1000,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  return tokens;
}

export function loadStoredTokens(): AuthTokens | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/** Returns a valid ID token, transparently refreshing if it's near expiry. */
export async function getValidIdToken(tokens: AuthTokens): Promise<{ idToken: string; tokens: AuthTokens }> {
  if (Date.now() < tokens.expiresAt - 60_000) {
    return { idToken: tokens.idToken, tokens };
  }
  const fresh = await refresh(tokens.refreshToken);
  return { idToken: fresh.idToken, tokens: fresh };
}
