import * as SecureStore from "expo-secure-store";

const TOKEN_KEYS = {
  accessToken: "sms_access_token",
  refreshToken: "sms_refresh_token",
} as const;

type TokenKey = keyof typeof TOKEN_KEYS;

/**
 * Get a token from secure storage.
 */
export async function getToken(key: TokenKey): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEYS[key]);
  } catch {
    return null;
  }
}

/**
 * Store both access and refresh tokens securely.
 */
export async function setTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEYS.accessToken, accessToken);
  await SecureStore.setItemAsync(TOKEN_KEYS.refreshToken, refreshToken);
}

/**
 * Clear all stored tokens (on logout or refresh failure).
 */
export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEYS.accessToken);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.refreshToken);
}
