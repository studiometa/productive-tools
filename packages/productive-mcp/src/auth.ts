/**
 * Authentication utilities for Productive MCP server
 */

export interface ProductiveCredentials {
  organizationId: string;
  apiToken: string;
  userId?: string;
}

/**
 * Parse Bearer token containing Productive credentials
 * Token format: base64(organizationId:apiToken) or base64(organizationId:apiToken:userId)
 *
 * @param authHeader - Authorization header value (e.g., "Bearer base64...")
 * @returns Parsed credentials or null if invalid
 */
export function parseAuthHeader(
  authHeader: string | undefined | null,
): ProductiveCredentials | null {
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  const token = match[1];

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length < 2) {
      return null;
    }

    const [organizationId, apiToken, userId] = parts;

    if (!organizationId || !apiToken) {
      return null;
    }

    return {
      organizationId,
      apiToken,
      userId: userId || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Create a Bearer token from Productive credentials
 * Useful for documentation and testing
 *
 * @param credentials - Productive credentials
 * @returns Base64 encoded token (without "Bearer " prefix)
 */
export function createAuthToken(credentials: ProductiveCredentials): string {
  const parts = [credentials.organizationId, credentials.apiToken];
  if (credentials.userId) {
    parts.push(credentials.userId);
  }
  return Buffer.from(parts.join(':')).toString('base64');
}
