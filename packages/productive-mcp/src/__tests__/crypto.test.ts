import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { encrypt, decrypt, createAuthCode, decodeAuthCode, getSecret } from '../crypto.js';

describe('crypto', () => {
  const originalEnv = process.env.OAUTH_SECRET;

  beforeEach(() => {
    // Set a test secret
    process.env.OAUTH_SECRET = 'test-secret-for-unit-tests';
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.OAUTH_SECRET = originalEnv;
    } else {
      delete process.env.OAUTH_SECRET;
    }
  });

  describe('getSecret', () => {
    it('returns OAUTH_SECRET from environment', () => {
      process.env.OAUTH_SECRET = 'my-secret';
      expect(getSecret()).toBe('my-secret');
    });

    it('returns default secret when OAUTH_SECRET is not set', () => {
      delete process.env.OAUTH_SECRET;
      expect(getSecret()).toBe('productive-mcp-default-secret-change-me');
    });
  });

  describe('encrypt/decrypt', () => {
    it('encrypts and decrypts a string', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('encrypts and decrypts JSON', () => {
      const data = { orgId: '12345', apiToken: 'pk_abc123', userId: '67890' };
      const encrypted = encrypt(JSON.stringify(data));
      const decrypted = JSON.parse(decrypt(encrypted));
      expect(decrypted).toEqual(data);
    });

    it('produces different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'Same text';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('fails to decrypt with wrong secret', () => {
      const encrypted = encrypt('test', 'secret1');
      expect(() => decrypt(encrypted, 'secret2')).toThrow('Decryption failed');
    });

    it('fails to decrypt corrupted data', () => {
      const encrypted = encrypt('test');
      const corrupted = encrypted.slice(0, -4) + 'XXXX';
      expect(() => decrypt(corrupted)).toThrow('Decryption failed');
    });

    it('handles unicode characters', () => {
      const plaintext = '你好世界 🌍 émojis';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('handles empty string', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('handles long strings', () => {
      const plaintext = 'a'.repeat(10000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('createAuthCode/decodeAuthCode', () => {
    it('creates and decodes an auth code with all fields', () => {
      const credentials = { orgId: '12345', apiToken: 'pk_test', userId: '67890' };
      const code = createAuthCode(credentials);
      const decoded = decodeAuthCode(code);

      expect(decoded.orgId).toBe('12345');
      expect(decoded.apiToken).toBe('pk_test');
      expect(decoded.userId).toBe('67890');
    });

    it('creates and decodes an auth code without userId', () => {
      const credentials = { orgId: '12345', apiToken: 'pk_test' };
      const code = createAuthCode(credentials);
      const decoded = decodeAuthCode(code);

      expect(decoded.orgId).toBe('12345');
      expect(decoded.apiToken).toBe('pk_test');
      expect(decoded.userId).toBeUndefined();
    });

    it('rejects expired auth codes', async () => {
      const credentials = { orgId: '12345', apiToken: 'pk_test' };
      // Create code that expires in 1ms
      const code = createAuthCode(credentials, 0.001);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(() => decodeAuthCode(code)).toThrow('Authorization code expired');
    });

    it('accepts non-expired auth codes', () => {
      const credentials = { orgId: '12345', apiToken: 'pk_test' };
      const code = createAuthCode(credentials, 300); // 5 minutes

      const decoded = decodeAuthCode(code);
      expect(decoded.orgId).toBe('12345');
    });

    it('rejects invalid codes', () => {
      expect(() => decodeAuthCode('invalid-code')).toThrow();
    });

    it('rejects codes with missing credentials', () => {
      const invalidPayload = JSON.stringify({ foo: 'bar' });
      const code = encrypt(invalidPayload);
      expect(() => decodeAuthCode(code)).toThrow('Invalid authorization code: missing credentials');
    });
  });
});
