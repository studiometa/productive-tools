/**
 * Cryptographic utilities for stateless OAuth tokens
 *
 * Uses AES-256-GCM for authenticated encryption.
 * The authorization code contains encrypted credentials that can be
 * decrypted without server-side storage.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;

/**
 * Derive a 256-bit key from a password using scrypt
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, 32);
}

/**
 * Get the encryption secret from environment or generate a default
 * In production, OAUTH_SECRET should always be set
 */
export function getSecret(): string {
  const secret = process.env.OAUTH_SECRET;
  if (!secret) {
    console.warn(
      'WARNING: OAUTH_SECRET not set. Using default secret. Set OAUTH_SECRET in production!'
    );
    return 'productive-mcp-default-secret-change-me';
  }
  return secret;
}

/**
 * Encrypt data using AES-256-GCM
 *
 * Output format: base64(salt + iv + authTag + ciphertext)
 *
 * @param plaintext - Data to encrypt
 * @param secret - Encryption secret (defaults to OAUTH_SECRET env var)
 * @returns Base64-encoded encrypted data
 */
export function encrypt(plaintext: string, secret: string = getSecret()): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(secret, salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine: salt + iv + authTag + ciphertext
  const combined = Buffer.concat([salt, iv, authTag, encrypted]);

  return combined.toString('base64url');
}

/**
 * Decrypt data encrypted with encrypt()
 *
 * @param ciphertext - Base64-encoded encrypted data
 * @param secret - Encryption secret (defaults to OAUTH_SECRET env var)
 * @returns Decrypted plaintext
 * @throws Error if decryption fails (invalid data or wrong secret)
 */
export function decrypt(ciphertext: string, secret: string = getSecret()): string {
  try {
    const combined = Buffer.from(ciphertext, 'base64url');

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

    const key = deriveKey(secret, salt);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString('utf8');
  } catch {
    throw new Error('Decryption failed: invalid token or secret');
  }
}

/**
 * Authorization code payload structure
 */
export interface AuthCodePayload {
  orgId: string;
  apiToken: string;
  userId?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

/**
 * Create an encrypted authorization code containing credentials and PKCE challenge
 *
 * @param credentials - Object with orgId, apiToken, userId, and optional PKCE params
 * @param expiresInSeconds - Code expiration time (default: 5 minutes)
 * @returns Encrypted authorization code
 */
export function createAuthCode(
  credentials: AuthCodePayload,
  expiresInSeconds: number = 300
): string {
  const payload = {
    ...credentials,
    exp: Date.now() + expiresInSeconds * 1000,
  };
  return encrypt(JSON.stringify(payload));
}

/**
 * Decode and validate an authorization code
 *
 * @param code - Encrypted authorization code
 * @returns Decoded payload with credentials and PKCE challenge
 * @throws Error if code is invalid or expired
 */
export function decodeAuthCode(code: string): AuthCodePayload {
  const payload = JSON.parse(decrypt(code));

  if (payload.exp && Date.now() > payload.exp) {
    throw new Error('Authorization code expired');
  }

  const { orgId, apiToken, userId, codeChallenge, codeChallengeMethod } = payload;

  if (!orgId || !apiToken) {
    throw new Error('Invalid authorization code: missing credentials');
  }

  return { orgId, apiToken, userId, codeChallenge, codeChallengeMethod };
}
