import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_RATE_LIMIT_CONFIG, RateLimiter } from './rate-limiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('uses default config when no options provided', () => {
      const limiter = new RateLimiter();
      expect(limiter.enabled).toBe(true);
    });

    it('merges custom config with defaults', () => {
      const limiter = new RateLimiter({ maxRetries: 5 });
      expect(limiter.enabled).toBe(true);
      expect(limiter.shouldRetry(4)).toBe(true); // 4 < 5
    });

    it('respects enabled: false', () => {
      const limiter = new RateLimiter({ enabled: false });
      expect(limiter.enabled).toBe(false);
    });
  });

  describe('DEFAULT_RATE_LIMIT_CONFIG', () => {
    it('has expected default values', () => {
      expect(DEFAULT_RATE_LIMIT_CONFIG).toEqual({
        enabled: true,
        maxRetries: 3,
        maxRequestsPer10s: 100,
        reportsMaxPer30s: 10,
        initialBackoffMs: 1000,
        maxBackoffMs: 30000,
      });
    });
  });

  describe('acquire', () => {
    it('returns immediately when disabled', async () => {
      const limiter = new RateLimiter({ enabled: false });
      const start = Date.now();

      await limiter.acquire('/projects');

      // Should not have waited
      expect(Date.now() - start).toBe(0);
    });

    it('returns immediately when under rate limit', async () => {
      const limiter = new RateLimiter({ maxRequestsPer10s: 100 });
      const start = Date.now();

      await limiter.acquire('/projects');

      expect(Date.now() - start).toBe(0);
    });

    it('tracks timestamps correctly in sliding window', async () => {
      const limiter = new RateLimiter({ maxRequestsPer10s: 3 });

      // Make 3 requests (at the limit)
      await limiter.acquire('/projects');
      await limiter.acquire('/projects');
      await limiter.acquire('/projects');

      // The 4th request should wait
      const acquirePromise = limiter.acquire('/projects');

      // Advance time just a bit - should still be waiting
      await vi.advanceTimersByTimeAsync(5000);

      // Advance past the 10s window - should complete
      await vi.advanceTimersByTimeAsync(5002);

      await acquirePromise;
    });

    it('delays when window is full', async () => {
      const limiter = new RateLimiter({ maxRequestsPer10s: 2 });

      // Fill the window
      await limiter.acquire('/projects');
      await limiter.acquire('/projects');

      // Start the 3rd request (should wait)
      let resolved = false;
      const acquirePromise = limiter.acquire('/projects').then(() => {
        resolved = true;
      });

      // Should not resolve immediately
      await vi.advanceTimersByTimeAsync(0);
      expect(resolved).toBe(false);

      // Advance past the window
      await vi.advanceTimersByTimeAsync(10001);
      await acquirePromise;
      expect(resolved).toBe(true);
    });

    it('uses separate tracking for report endpoints', async () => {
      const limiter = new RateLimiter({
        maxRequestsPer10s: 100,
        reportsMaxPer30s: 2,
      });

      // Make 2 report requests (at the limit)
      await limiter.acquire('/reports/time_reports');
      await limiter.acquire('/reports/budget_reports');

      // 3rd report should wait
      let resolved = false;
      const acquirePromise = limiter.acquire('/reports/something').then(() => {
        resolved = true;
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(resolved).toBe(false);

      // Advance past the 30s window
      await vi.advanceTimersByTimeAsync(30001);
      await acquirePromise;
      expect(resolved).toBe(true);
    });

    it('detects report endpoints correctly', async () => {
      const limiter = new RateLimiter({
        maxRequestsPer10s: 100,
        reportsMaxPer30s: 1,
      });

      // First report request
      await limiter.acquire('/reports/time_reports');

      // Regular endpoint should still work
      await limiter.acquire('/projects');

      // Second report should wait
      let resolved = false;
      const acquirePromise = limiter.acquire('/reports/budget').then(() => {
        resolved = true;
      });

      await vi.advanceTimersByTimeAsync(0);
      expect(resolved).toBe(false);

      await vi.advanceTimersByTimeAsync(30001);
      await acquirePromise;
    });

    it('cleans up expired timestamps', async () => {
      const limiter = new RateLimiter({ maxRequestsPer10s: 2 });

      // Make 2 requests
      await limiter.acquire('/projects');
      await limiter.acquire('/projects');

      // Advance time past the window
      await vi.advanceTimersByTimeAsync(10001);

      // Should be able to make requests again without waiting
      const start = Date.now();
      await limiter.acquire('/projects');
      expect(Date.now() - start).toBe(0);
    });
  });

  describe('shouldRetry', () => {
    it('returns true when under maxRetries', () => {
      const limiter = new RateLimiter({ maxRetries: 3 });

      expect(limiter.shouldRetry(0)).toBe(true);
      expect(limiter.shouldRetry(1)).toBe(true);
      expect(limiter.shouldRetry(2)).toBe(true);
    });

    it('returns false when at or over maxRetries', () => {
      const limiter = new RateLimiter({ maxRetries: 3 });

      expect(limiter.shouldRetry(3)).toBe(false);
      expect(limiter.shouldRetry(4)).toBe(false);
    });

    it('returns false when disabled', () => {
      const limiter = new RateLimiter({ enabled: false });

      expect(limiter.shouldRetry(0)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('calculates exponential backoff with jitter', () => {
      const limiter = new RateLimiter({
        initialBackoffMs: 1000,
        maxBackoffMs: 30000,
      });

      // Mock Math.random to return 0.5 (middle of jitter range)
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      // attempt 0: 1000 * 2^0 * 0.75 = 750
      expect(limiter.getRetryDelay(0)).toBe(750);

      // attempt 1: 1000 * 2^1 * 0.75 = 1500
      expect(limiter.getRetryDelay(1)).toBe(1500);

      // attempt 2: 1000 * 2^2 * 0.75 = 3000
      expect(limiter.getRetryDelay(2)).toBe(3000);

      vi.restoreAllMocks();
    });

    it('caps at maxBackoffMs', () => {
      const limiter = new RateLimiter({
        initialBackoffMs: 1000,
        maxBackoffMs: 5000,
      });

      // With high attempt number, should be capped
      vi.spyOn(Math, 'random').mockReturnValue(1); // Max jitter (1.0)
      // attempt 10: min(5000, 1000 * 2^10) * 1.0 = 5000
      expect(limiter.getRetryDelay(10)).toBe(5000);

      vi.restoreAllMocks();
    });

    it('applies jitter between 0.5 and 1.0 of the delay', () => {
      const limiter = new RateLimiter({
        initialBackoffMs: 1000,
        maxBackoffMs: 30000,
      });

      // Min jitter (random = 0)
      vi.spyOn(Math, 'random').mockReturnValue(0);
      // 1000 * 2^0 * 0.5 = 500
      expect(limiter.getRetryDelay(0)).toBe(500);

      // Max jitter (random = 1)
      vi.spyOn(Math, 'random').mockReturnValue(1);
      // 1000 * 2^0 * 1.0 = 1000
      expect(limiter.getRetryDelay(0)).toBe(1000);

      vi.restoreAllMocks();
    });

    it('respects Retry-After header with seconds', () => {
      const limiter = new RateLimiter();

      // Should use the header value in seconds converted to ms
      expect(limiter.getRetryDelay(0, '5')).toBe(5000);
      expect(limiter.getRetryDelay(0, '60')).toBe(60000);
    });

    it('respects Retry-After header with HTTP-date', () => {
      const limiter = new RateLimiter();

      // Set current time to a known value
      const now = new Date('2026-01-15T10:00:00Z').getTime();
      vi.setSystemTime(now);

      // Retry-After date is 10 seconds in the future
      const futureDate = new Date('2026-01-15T10:00:10Z').toUTCString();
      expect(limiter.getRetryDelay(0, futureDate)).toBe(10000);
    });

    it('falls back to exponential backoff for invalid Retry-After', () => {
      const limiter = new RateLimiter({
        initialBackoffMs: 1000,
        maxBackoffMs: 30000,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      // Invalid header should fall back to exponential backoff
      expect(limiter.getRetryDelay(0, 'invalid-value')).toBe(750);
      expect(limiter.getRetryDelay(0, '')).toBe(750);

      vi.restoreAllMocks();
    });

    it('handles Retry-After date in the past', () => {
      const limiter = new RateLimiter();

      // Set current time
      const now = new Date('2026-01-15T10:00:00Z').getTime();
      vi.setSystemTime(now);

      // Retry-After date is in the past
      const pastDate = new Date('2026-01-15T09:59:50Z').toUTCString();
      expect(limiter.getRetryDelay(0, pastDate)).toBe(0);
    });

    it('handles zero seconds in Retry-After', () => {
      const limiter = new RateLimiter();
      expect(limiter.getRetryDelay(0, '0')).toBe(0);
    });
  });

  describe('recordResponse', () => {
    it('accepts response without error', () => {
      const limiter = new RateLimiter();

      // Should not throw
      limiter.recordResponse(200);
      limiter.recordResponse(429, '5');
    });
  });

  describe('integration scenarios', () => {
    it('handles burst of requests within limit', async () => {
      const limiter = new RateLimiter({ maxRequestsPer10s: 5 });

      // 5 requests should complete immediately
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(limiter.acquire('/projects'));
      }

      await Promise.all(promises);
      // Should not have advanced time
    });

    it('handles mixed regular and report endpoints', async () => {
      const limiter = new RateLimiter({
        maxRequestsPer10s: 3,
        reportsMaxPer30s: 1,
      });

      // 1 report + 2 regular = should all succeed
      await limiter.acquire('/reports/time');
      await limiter.acquire('/projects');
      await limiter.acquire('/tasks');

      // 2nd report should wait (30s window for reports)
      let resolved = false;
      const reportPromise = limiter.acquire('/reports/budget').then(() => {
        resolved = true;
      });

      await vi.advanceTimersByTimeAsync(10000);
      expect(resolved).toBe(false); // Still waiting (need 30s for reports)

      await vi.advanceTimersByTimeAsync(20001);
      await reportPromise;
      expect(resolved).toBe(true);
    });
  });
});
