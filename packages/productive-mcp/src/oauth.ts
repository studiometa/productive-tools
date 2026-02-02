/**
 * OAuth 2.0 endpoints for Claude Desktop integration
 *
 * Implements OAuth 2.1 with PKCE as specified in the MCP authorization spec.
 * Uses stateless encrypted tokens - no server-side storage required.
 *
 * Spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization
 *
 * Flow:
 * 1. Claude redirects user to /authorize with OAuth params (including PKCE)
 * 2. User enters Productive credentials in login form
 * 3. Server encrypts credentials + PKCE challenge into authorization code
 * 4. Redirects back to Claude with the code
 * 5. Claude exchanges code for access token via /token (with code_verifier)
 * 6. Server validates PKCE and returns access token
 */

import { createHash } from 'node:crypto';
import {
  defineEventHandler,
  getQuery,
  readBody,
  sendRedirect,
  setResponseHeader,
  type H3Event,
} from 'h3';
import { createAuthCode, decodeAuthCode } from './crypto.js';
import { createAuthToken } from './auth.js';

/**
 * OAuth metadata for discovery (RFC 8414)
 * GET /.well-known/oauth-authorization-server
 *
 * MCP clients MUST check this endpoint first for server capabilities.
 */
export const oauthMetadataHandler = defineEventHandler((event: H3Event) => {
  const host = event.node.req.headers.host || 'localhost:3000';
  const protocol = event.node.req.headers['x-forwarded-proto'] || 'http';
  const baseUrl = `${protocol}://${host}`;

  setResponseHeader(event, 'Content-Type', 'application/json');
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600');

  return {
    // Required fields per RFC 8414
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/authorize`,
    token_endpoint: `${baseUrl}/token`,
    response_types_supported: ['code'],

    // OAuth 2.1 / MCP requirements
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'], // Public client

    // Optional but useful
    registration_endpoint: `${baseUrl}/register`,
    scopes_supported: ['productive'],
    service_documentation: 'https://github.com/studiometa/productive-tools',
  };
});

/**
 * Dynamic Client Registration endpoint (RFC 7591)
 * POST /register
 *
 * MCP servers SHOULD support DCR to allow clients to register automatically.
 * Since we use stateless tokens, we accept any registration and return
 * a generated client_id.
 */
export const registerHandler = defineEventHandler(async (event: H3Event) => {
  setResponseHeader(event, 'Content-Type', 'application/json');

  let body: Record<string, unknown>;
  try {
    body = await readBody(event);
  } catch {
    event.node.res.statusCode = 400;
    return {
      error: 'invalid_request',
      error_description: 'Invalid JSON body',
    };
  }

  // Extract client metadata
  const clientName = (body.client_name as string) || 'MCP Client';
  const redirectUris = (body.redirect_uris as string[]) || [];

  // Generate a client_id based on the registration
  // Since we're stateless, we encode minimal info in the client_id
  const clientId = Buffer.from(
    JSON.stringify({
      name: clientName,
      ts: Date.now(),
    })
  ).toString('base64url');

  event.node.res.statusCode = 201;
  return {
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
    token_endpoint_auth_method: 'none',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
  };
});

/**
 * Authorization endpoint - shows login form
 * GET /authorize
 */
export const authorizeGetHandler = defineEventHandler((event: H3Event) => {
  const query = getQuery(event);

  // Extract OAuth parameters
  const clientId = query.client_id as string;
  const redirectUri = query.redirect_uri as string;
  const state = query.state as string;
  const codeChallenge = query.code_challenge as string;
  const codeChallengeMethod = query.code_challenge_method as string;
  const scope = query.scope as string;

  // Validate required parameters per OAuth 2.1
  if (!redirectUri) {
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8');
    event.node.res.statusCode = 400;
    return renderErrorPage('Missing required parameter: redirect_uri');
  }

  // PKCE is REQUIRED for public clients per MCP spec
  if (!codeChallenge) {
    // Redirect back with error per OAuth spec
    const errorUrl = new URL(redirectUri);
    errorUrl.searchParams.set('error', 'invalid_request');
    errorUrl.searchParams.set('error_description', 'code_challenge is required');
    if (state) errorUrl.searchParams.set('state', state);
    return sendRedirect(event, errorUrl.toString());
  }

  if (codeChallengeMethod && codeChallengeMethod !== 'S256') {
    const errorUrl = new URL(redirectUri);
    errorUrl.searchParams.set('error', 'invalid_request');
    errorUrl.searchParams.set('error_description', 'Only S256 code_challenge_method is supported');
    if (state) errorUrl.searchParams.set('state', state);
    return sendRedirect(event, errorUrl.toString());
  }

  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8');

  // Render login form
  return renderLoginForm({
    clientId,
    redirectUri,
    state,
    codeChallenge,
    codeChallengeMethod: codeChallengeMethod || 'S256',
    scope,
  });
});

/**
 * Authorization endpoint - process login
 * POST /authorize
 */
export const authorizePostHandler = defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event);

  const {
    orgId,
    apiToken,
    userId,
    redirectUri,
    state,
    codeChallenge,
    codeChallengeMethod,
  } = body;

  // Validate redirect URI first (security requirement)
  if (!redirectUri) {
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8');
    event.node.res.statusCode = 400;
    return renderErrorPage('Missing redirect_uri parameter');
  }

  // Validate redirect URI format (must be HTTPS or localhost)
  try {
    const uri = new URL(redirectUri);
    const isLocalhost = uri.hostname === 'localhost' || uri.hostname === '127.0.0.1';
    const isHttps = uri.protocol === 'https:';
    if (!isLocalhost && !isHttps) {
      event.node.res.statusCode = 400;
      return renderErrorPage('redirect_uri must be HTTPS or localhost');
    }
  } catch {
    event.node.res.statusCode = 400;
    return renderErrorPage('Invalid redirect_uri format');
  }

  // Validate required credentials
  if (!orgId || !apiToken) {
    setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8');
    return renderLoginForm({
      redirectUri,
      state,
      codeChallenge,
      codeChallengeMethod,
      error: 'Organization ID and API Token are required',
    });
  }

  // Create encrypted authorization code with PKCE challenge
  const code = createAuthCode({
    orgId,
    apiToken,
    userId: userId || undefined,
    codeChallenge,
    codeChallengeMethod: codeChallengeMethod || 'S256',
  });

  // Build redirect URL with authorization code
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.set('code', code);
  if (state) {
    redirectUrl.searchParams.set('state', state);
  }

  // Redirect back to Claude
  return sendRedirect(event, redirectUrl.toString());
});

/**
 * Token endpoint - exchange code for access token
 * POST /token
 *
 * Supports:
 * - authorization_code grant (with PKCE validation)
 * - refresh_token grant
 */
export const tokenHandler = defineEventHandler(async (event: H3Event) => {
  setResponseHeader(event, 'Content-Type', 'application/json');

  let body: Record<string, string>;
  const contentType = event.node.req.headers['content-type'] || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const rawBody = await readBody(event);
    if (typeof rawBody === 'string') {
      body = Object.fromEntries(new URLSearchParams(rawBody));
    } else {
      body = rawBody;
    }
  } else {
    body = await readBody(event);
  }

  const { grant_type, code, code_verifier, refresh_token } = body;

  // Handle refresh token grant
  if (grant_type === 'refresh_token') {
    return handleRefreshToken(event, refresh_token);
  }

  // Validate authorization code grant
  if (grant_type !== 'authorization_code') {
    event.node.res.statusCode = 400;
    return {
      error: 'unsupported_grant_type',
      error_description: 'Supported grant types: authorization_code, refresh_token',
    };
  }

  if (!code) {
    event.node.res.statusCode = 400;
    return {
      error: 'invalid_request',
      error_description: 'Missing authorization code',
    };
  }

  if (!code_verifier) {
    event.node.res.statusCode = 400;
    return {
      error: 'invalid_request',
      error_description: 'Missing code_verifier (PKCE required)',
    };
  }

  try {
    // Decode the authorization code
    const payload = decodeAuthCode(code);

    // Validate PKCE: SHA256(code_verifier) must equal code_challenge
    if (payload.codeChallenge) {
      const expectedChallenge = createS256Challenge(code_verifier);
      if (expectedChallenge !== payload.codeChallenge) {
        event.node.res.statusCode = 400;
        return {
          error: 'invalid_grant',
          error_description: 'Invalid code_verifier',
        };
      }
    }

    // Create access token (base64 encoded credentials)
    const accessToken = createAuthToken({
      organizationId: payload.orgId,
      apiToken: payload.apiToken,
      userId: payload.userId,
    });

    // Create refresh token (encrypted credentials, longer expiry)
    const refreshToken = createAuthCode(
      {
        orgId: payload.orgId,
        apiToken: payload.apiToken,
        userId: payload.userId,
      },
      86400 * 30 // 30 days
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour (access tokens should be short-lived)
      refresh_token: refreshToken,
    };
  } catch (error) {
    event.node.res.statusCode = 400;
    return {
      error: 'invalid_grant',
      error_description: error instanceof Error ? error.message : 'Invalid authorization code',
    };
  }
});

/**
 * Handle refresh token grant
 */
function handleRefreshToken(event: H3Event, refreshToken: string | undefined) {
  if (!refreshToken) {
    event.node.res.statusCode = 400;
    return {
      error: 'invalid_request',
      error_description: 'Missing refresh_token',
    };
  }

  try {
    // Decode refresh token (it's just an encrypted auth code with longer expiry)
    const payload = decodeAuthCode(refreshToken);

    // Create new access token
    const accessToken = createAuthToken({
      organizationId: payload.orgId,
      apiToken: payload.apiToken,
      userId: payload.userId,
    });

    // Create new refresh token (rotate for security)
    const newRefreshToken = createAuthCode(
      {
        orgId: payload.orgId,
        apiToken: payload.apiToken,
        userId: payload.userId,
      },
      86400 * 30 // 30 days
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: newRefreshToken,
    };
  } catch (error) {
    event.node.res.statusCode = 400;
    return {
      error: 'invalid_grant',
      error_description: error instanceof Error ? error.message : 'Invalid refresh token',
    };
  }
}

/**
 * Create S256 PKCE challenge from verifier
 * SHA256(code_verifier) encoded as base64url
 */
function createS256Challenge(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}

/**
 * Render the login form HTML
 */
function renderLoginForm(params: {
  clientId?: string;
  redirectUri?: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  scope?: string;
  error?: string;
}): string {
  const { redirectUri, state, codeChallenge, codeChallengeMethod, error } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Connect to Productive.io</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      width: 100%;
      max-width: 420px;
    }
    .logo {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo svg {
      width: 48px;
      height: 48px;
    }
    h1 {
      text-align: center;
      color: #1a1a2e;
      font-size: 24px;
      margin-bottom: 8px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-bottom: 32px;
    }
    .error {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }
    input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }
    input::placeholder {
      color: #9ca3af;
    }
    .help-text {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    button {
      width: 100%;
      padding: 14px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: #9ca3af;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 17L12 22L22 17" stroke="#764ba2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 12L12 17L22 12" stroke="#667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h1>Connect to Productive.io</h1>
    <p class="subtitle">Enter your Productive.io credentials to connect with Claude</p>
    
    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ''}
    
    <form method="POST" action="/authorize">
      <input type="hidden" name="redirectUri" value="${escapeHtml(redirectUri || '')}">
      <input type="hidden" name="state" value="${escapeHtml(state || '')}">
      <input type="hidden" name="codeChallenge" value="${escapeHtml(codeChallenge || '')}">
      <input type="hidden" name="codeChallengeMethod" value="${escapeHtml(codeChallengeMethod || 'S256')}">
      
      <div class="form-group">
        <label for="orgId">Organization ID *</label>
        <input type="text" id="orgId" name="orgId" required placeholder="e.g., 12345">
        <p class="help-text">Found in Settings → API integrations</p>
      </div>
      
      <div class="form-group">
        <label for="apiToken">API Token *</label>
        <input type="password" id="apiToken" name="apiToken" required placeholder="pk_...">
        <p class="help-text">Generate at Settings → API integrations → Generate new token</p>
      </div>
      
      <div class="form-group">
        <label for="userId">User ID (optional)</label>
        <input type="text" id="userId" name="userId" placeholder="e.g., 67890">
        <p class="help-text">Required for creating time entries. Found in your profile URL.</p>
      </div>
      
      <button type="submit">Connect to Productive</button>
    </form>
    
    <p class="footer">
      Your credentials are encrypted and sent directly to Claude.<br>
      <a href="https://developer.productive.io" target="_blank">Productive.io API Documentation</a>
    </p>
  </div>
</body>
</html>`;
}

/**
 * Render error page
 */
function renderErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Productive MCP</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      padding: 40px;
      text-align: center;
      max-width: 400px;
    }
    h1 {
      color: #dc2626;
      margin-bottom: 16px;
    }
    p {
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Error</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
