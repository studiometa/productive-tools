import { createApp, createRouter, toNodeListener } from 'h3';
import { createHash } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { decodeAuthCode } from '../crypto.js';
import {
  oauthMetadataHandler,
  registerHandler,
  authorizeGetHandler,
  authorizePostHandler,
  tokenHandler,
} from '../oauth.js';

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE() {
  // Generate a random code verifier (43-128 characters)
  const codeVerifier = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    'base64url',
  );
  // Create S256 challenge
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

/**
 * Extract redirect URL from success page HTML
 */
function extractRedirectUrl(html: string): string {
  const metaMatch = html.match(/content="2;url=([^"]+)"/);
  if (!metaMatch) {
    throw new Error('Could not extract redirect URL from success page');
  }
  // Unescape HTML entities
  return metaMatch[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

describe('OAuth endpoints', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    // Set test secret
    process.env.OAUTH_SECRET = 'test-oauth-secret';

    // Create test app
    const app = createApp();
    const router = createRouter();
    router.get('/.well-known/oauth-authorization-server', oauthMetadataHandler);
    router.post('/register', registerHandler);
    router.get('/authorize', authorizeGetHandler);
    router.post('/authorize', authorizePostHandler);
    router.post('/token', tokenHandler);
    app.use(router);

    // Start server
    server = createServer(toNodeListener(app));
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('GET /.well-known/oauth-authorization-server', () => {
    it('returns OAuth metadata per RFC 8414', async () => {
      const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
      expect(response.ok).toBe(true);

      const metadata = await response.json();
      expect(metadata).toMatchObject({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/authorize`,
        token_endpoint: `${baseUrl}/token`,
        registration_endpoint: `${baseUrl}/register`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none'],
      });
    });
  });

  describe('POST /register (Dynamic Client Registration)', () => {
    it('registers a new client', async () => {
      const response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: 'Test Client',
          redirect_uris: ['https://example.com/callback'],
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toMatchObject({
        client_id: expect.any(String),
        client_name: 'Test Client',
        redirect_uris: ['https://example.com/callback'],
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
      });
    });

    it('uses default client name when not provided', async () => {
      const response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.client_name).toBe('MCP Client');
    });

    it('rejects invalid JSON body', async () => {
      const response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json{',
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('invalid_request');
      expect(data.error_description).toContain('Invalid JSON');
    });
  });

  describe('GET /authorize', () => {
    it('returns login form HTML with valid PKCE params', async () => {
      const { codeChallenge } = generatePKCE();
      const response = await fetch(
        `${baseUrl}/authorize?client_id=test&redirect_uri=https://example.com/callback&state=abc123&code_challenge=${codeChallenge}&code_challenge_method=S256`,
      );
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/html');

      const html = await response.text();
      expect(html).toContain('Connect to Productive.io');
      expect(html).toContain('Organization ID');
      expect(html).toContain('API Token');
      expect(html).toContain('User ID');
      expect(html).toContain('abc123'); // state in hidden field
      expect(html).toContain(codeChallenge); // code_challenge in hidden field
    });

    it('redirects with error when code_challenge is missing', async () => {
      const response = await fetch(
        `${baseUrl}/authorize?client_id=test&redirect_uri=https://example.com/callback&state=abc123`,
        { redirect: 'manual' },
      );

      expect(response.status).toBe(302);
      const location = response.headers.get('location')!;
      const redirectUrl = new URL(location);
      expect(redirectUrl.searchParams.get('error')).toBe('invalid_request');
      expect(redirectUrl.searchParams.get('error_description')).toContain('code_challenge');
      expect(redirectUrl.searchParams.get('state')).toBe('abc123');
    });

    it('returns error when redirect_uri is missing', async () => {
      const response = await fetch(`${baseUrl}/authorize?client_id=test`);
      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain('redirect_uri');
    });

    it('rejects unsupported code_challenge_method', async () => {
      const response = await fetch(
        `${baseUrl}/authorize?client_id=test&redirect_uri=https://example.com/callback&state=abc&code_challenge=test&code_challenge_method=plain`,
        { redirect: 'manual' },
      );

      expect(response.status).toBe(302);
      const location = response.headers.get('location')!;
      const redirectUrl = new URL(location);
      expect(redirectUrl.searchParams.get('error')).toBe('invalid_request');
      expect(redirectUrl.searchParams.get('error_description')).toContain('S256');
    });
  });

  describe('POST /authorize', () => {
    it('shows success page with redirect URL on valid credentials', async () => {
      const { codeChallenge } = generatePKCE();
      const response = await fetch(`${baseUrl}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          orgId: '12345',
          apiToken: 'pk_test123',
          userId: '67890',
          redirectUri: 'https://example.com/callback',
          state: 'test-state',
          codeChallenge,
          codeChallengeMethod: 'S256',
        }).toString(),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');

      const html = await response.text();
      expect(html).toContain('Successfully Connected');
      expect(html).toContain('Redirecting to Claude Desktop');

      // Extract redirect URL from meta refresh tag
      const metaMatch = html.match(/content="2;url=([^"]+)"/);
      expect(metaMatch).toBeTruthy();
      const extractedUrl = extractRedirectUrl(html);
      const redirectUrl = new URL(extractedUrl);

      expect(redirectUrl.origin).toBe('https://example.com');
      expect(redirectUrl.pathname).toBe('/callback');
      expect(redirectUrl.searchParams.get('state')).toBe('test-state');
      expect(redirectUrl.searchParams.get('code')).toBeTruthy();

      // Verify the code contains our credentials and PKCE challenge
      const code = redirectUrl.searchParams.get('code')!;
      const decoded = decodeAuthCode(code);
      expect(decoded.orgId).toBe('12345');
      expect(decoded.apiToken).toBe('pk_test123');
      expect(decoded.userId).toBe('67890');
      expect(decoded.codeChallenge).toBe(codeChallenge);
    });

    it('shows error when credentials are missing', async () => {
      const response = await fetch(`${baseUrl}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          redirectUri: 'https://example.com/callback',
        }).toString(),
      });

      expect(response.ok).toBe(true);
      const html = await response.text();
      expect(html).toContain('Organization ID and API Token are required');
    });

    it('shows error when redirectUri is missing in POST', async () => {
      const response = await fetch(`${baseUrl}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          orgId: '12345',
          apiToken: 'pk_test',
        }).toString(),
      });

      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain('redirect_uri');
    });

    it('rejects invalid redirect_uri format', async () => {
      const response = await fetch(`${baseUrl}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          orgId: '12345',
          apiToken: 'pk_test',
          redirectUri: 'not-a-valid-url',
        }).toString(),
      });

      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain('Invalid redirect_uri');
    });

    it('rejects non-HTTPS redirect URIs (except localhost)', async () => {
      const response = await fetch(`${baseUrl}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          orgId: '12345',
          apiToken: 'pk_test',
          redirectUri: 'http://example.com/callback',
        }).toString(),
      });

      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain('HTTPS');
    });

    it('allows localhost redirect URIs', async () => {
      const response = await fetch(`${baseUrl}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          orgId: '12345',
          apiToken: 'pk_test',
          redirectUri: 'http://localhost:3000/callback',
        }).toString(),
      });

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('Successfully Connected');
      expect(html).toContain('http://localhost:3000/callback');
    });
  });

  describe('POST /token', () => {
    it('exchanges authorization code for access token with valid PKCE', async () => {
      const { codeVerifier, codeChallenge } = generatePKCE();

      // Get an authorization code with PKCE challenge
      const authResponse = await fetch(`${baseUrl}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          orgId: '12345',
          apiToken: 'pk_test123',
          userId: '67890',
          redirectUri: 'https://example.com/callback',
          codeChallenge,
          codeChallengeMethod: 'S256',
        }).toString(),
      });

      const html = await authResponse.text();
      const redirectUrl = extractRedirectUrl(html);
      const code = new URL(redirectUrl).searchParams.get('code')!;

      // Exchange code for token with PKCE verifier
      const tokenResponse = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          code_verifier: codeVerifier,
        }).toString(),
      });

      expect(tokenResponse.ok).toBe(true);
      const tokenData = await tokenResponse.json();

      expect(tokenData).toMatchObject({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: expect.any(String),
      });

      // Verify the access token contains our credentials (base64 encoded)
      const decoded = Buffer.from(tokenData.access_token, 'base64').toString('utf-8');
      expect(decoded).toBe('12345:pk_test123:67890');
    });

    it('rejects invalid PKCE code_verifier', async () => {
      const { codeChallenge } = generatePKCE();

      // Get an authorization code
      const authResponse = await fetch(`${baseUrl}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          orgId: '12345',
          apiToken: 'pk_test',
          redirectUri: 'https://example.com/callback',
          codeChallenge,
          codeChallengeMethod: 'S256',
        }).toString(),
      });

      const html = await authResponse.text();
      const code = new URL(extractRedirectUrl(html)).searchParams.get('code')!;

      // Try to exchange with wrong verifier
      const tokenResponse = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          code_verifier: 'wrong-verifier',
        }),
      });

      expect(tokenResponse.status).toBe(400);
      const data = await tokenResponse.json();
      expect(data.error).toBe('invalid_grant');
      expect(data.error_description).toContain('code_verifier');
    });

    it('rejects missing code_verifier', async () => {
      const { codeChallenge } = generatePKCE();

      const authResponse = await fetch(`${baseUrl}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          orgId: '12345',
          apiToken: 'pk_test',
          redirectUri: 'https://example.com/callback',
          codeChallenge,
        }).toString(),
      });

      const html = await authResponse.text();
      const code = new URL(extractRedirectUrl(html)).searchParams.get('code')!;

      const tokenResponse = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
        }),
      });

      expect(tokenResponse.status).toBe(400);
      const data = await tokenResponse.json();
      expect(data.error).toBe('invalid_request');
      expect(data.error_description).toContain('code_verifier');
    });

    it('supports refresh_token grant', async () => {
      const { codeVerifier, codeChallenge } = generatePKCE();

      // Get initial tokens
      const authResponse = await fetch(`${baseUrl}/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          orgId: '12345',
          apiToken: 'pk_test123',
          redirectUri: 'https://example.com/callback',
          codeChallenge,
        }).toString(),
      });

      const html = await authResponse.text();
      const code = new URL(extractRedirectUrl(html)).searchParams.get('code')!;

      const tokenResponse = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          code_verifier: codeVerifier,
        }).toString(),
      });

      const tokenData = await tokenResponse.json();
      const refreshToken = tokenData.refresh_token;

      // Use refresh token
      const refreshResponse = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
      });

      expect(refreshResponse.ok).toBe(true);
      const refreshData = await refreshResponse.json();
      expect(refreshData).toMatchObject({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: expect.any(String),
      });

      // New refresh token should be different (rotation)
      expect(refreshData.refresh_token).not.toBe(refreshToken);
    });

    it('rejects unsupported grant type', async () => {
      const response = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('unsupported_grant_type');
    });

    it('rejects missing authorization code', async () => {
      const response = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code_verifier: 'some-verifier',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('invalid_request');
      expect(data.error_description).toContain('authorization code');
    });

    it('rejects invalid authorization code', async () => {
      const response = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: 'invalid-code',
          code_verifier: 'some-verifier',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('invalid_grant');
    });

    it('rejects missing refresh_token', async () => {
      const response = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('invalid_request');
      expect(data.error_description).toContain('refresh_token');
    });

    it('rejects invalid refresh_token', async () => {
      const response = await fetch(`${baseUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: 'invalid-token',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('invalid_grant');
    });
  });
});
