/**
 * lib/server/google-api-base.ts
 *
 * Google API 共通ベース関数
 * Calendar API と Tasks API で共有する基本機能
 */

import { getValidAccessToken } from './google-tokens';

export interface GoogleApiCallOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string>;
}

/**
 * Google API を呼び出す共通関数
 */
export async function callGoogleApi<T>(
  userId: string,
  baseUrl: string,
  endpoint: string,
  options: GoogleApiCallOptions = {}
): Promise<T | null> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    console.error('[Google API] No valid access token for user:', userId);
    return null;
  }

  const url = new URL(`${baseUrl}${endpoint}`);
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Google API] Error:', response.status, errorText);
      return null;
    }

    // DELETE は 204 No Content を返す場合がある
    if (response.status === 204) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('[Google API] Fetch error:', error);
    return null;
  }
}
