/**
 * Rate limiter for Productive API requests.
 *
 * Implements:
 * - Sliding window for proactive throttling
 * - Exponential backoff with jitter for 429 retries
 * - Separate tracking for report endpoints
 * - Retry-After header parsing
 */

export interface RateLimitConfig {
  /** Whether rate limiting is enabled (default: true) */
  enabled?: boolean;
  /** Maximum retry attempts for 429 responses (default: 3) */
  maxRetries?: number;
  /** Maximum requests per 10 seconds for regular endpoints (default: 100) */
  maxRequestsPer10s?: number;
  /** Maximum requests per 30 seconds for report endpoints (default: 10) */
  reportsMaxPer30s?: number;
  /** Initial backoff delay in ms (default: 1000) */
  initialBackoffMs?: number;
  /** Maximum backoff delay in ms (default: 30000) */
  maxBackoffMs?: number;
}

export const DEFAULT_RATE_LIMIT_CONFIG: Required<RateLimitConfig> = {
  enabled: true,
  maxRetries: 3,
  maxRequestsPer10s: 100,
  reportsMaxPer30s: 10,
  initialBackoffMs: 1000,
  maxBackoffMs: 30000,
};

/**
 * Rate limiter with sliding window and exponential backoff.
 */
export class RateLimiter {
  private readonly config: Required<RateLimitConfig>;
  private readonly requestTimestamps: number[] = [];
  private readonly reportTimestamps: number[] = [];

  constructor(config?: RateLimitConfig) {
    this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
  }

  /**
   * Check if rate limiting is enabled.
   */
  get enabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Acquire permission to make a request.
   * Returns a promise that resolves when it's safe to proceed.
   *
   * @param endpoint - The API endpoint (used to detect report endpoints)
   */
  async acquire(endpoint?: string): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const now = Date.now();
    const isReport = this.isReportEndpoint(endpoint);

    // Clean up expired timestamps and calculate wait time
    const waitTime = isReport
      ? this.getWaitTimeForWindow(this.reportTimestamps, 30000, this.config.reportsMaxPer30s, now)
      : this.getWaitTimeForWindow(
          this.requestTimestamps,
          10000,
          this.config.maxRequestsPer10s,
          now,
        );

    if (waitTime > 0) {
      await this.sleep(waitTime);
    }

    // Record this request
    const timestamp = Date.now();
    if (isReport) {
      this.reportTimestamps.push(timestamp);
    }
    // Always track in the general window too
    this.requestTimestamps.push(timestamp);
  }

  /**
   * Record a response status for tracking purposes.
   * Currently used for potential future enhancements like adaptive rate limiting.
   */
  recordResponse(_status: number, _retryAfter?: string): void {
    // Reserved for future use (e.g., adaptive rate limiting based on response patterns)
  }

  /**
   * Check if we should retry after a 429 response.
   *
   * @param attempt - Current attempt number (0-indexed)
   */
  shouldRetry(attempt: number): boolean {
    if (!this.config.enabled) {
      return false;
    }
    return attempt < this.config.maxRetries;
  }

  /**
   * Calculate delay before next retry using exponential backoff with jitter.
   *
   * Formula: min(maxBackoff, initialBackoff * 2^attempt) * (0.5 + random * 0.5)
   *
   * @param attempt - Current attempt number (0-indexed)
   * @param retryAfter - Optional Retry-After header value
   */
  getRetryDelay(attempt: number, retryAfter?: string): number {
    // If Retry-After header is present, use it
    if (retryAfter) {
      const parsedDelay = this.parseRetryAfter(retryAfter);
      if (parsedDelay !== null) {
        return parsedDelay;
      }
    }

    // Exponential backoff with jitter
    const exponentialDelay = this.config.initialBackoffMs * Math.pow(2, attempt);
    const cappedDelay = Math.min(this.config.maxBackoffMs, exponentialDelay);
    const jitter = 0.5 + Math.random() * 0.5;

    return Math.floor(cappedDelay * jitter);
  }

  /**
   * Check if an endpoint is a report endpoint.
   */
  private isReportEndpoint(endpoint?: string): boolean {
    if (!endpoint) {
      return false;
    }
    return endpoint.includes('/reports/');
  }

  /**
   * Calculate wait time for a sliding window.
   *
   * @param timestamps - Array of request timestamps
   * @param windowMs - Window duration in ms
   * @param maxRequests - Maximum requests allowed in the window
   * @param now - Current timestamp
   */
  private getWaitTimeForWindow(
    timestamps: number[],
    windowMs: number,
    maxRequests: number,
    now: number,
  ): number {
    // Remove expired timestamps
    const cutoff = now - windowMs;
    while (timestamps.length > 0 && timestamps[0] < cutoff) {
      timestamps.shift();
    }

    // If under the limit, no wait needed
    if (timestamps.length < maxRequests) {
      return 0;
    }

    // Wait until the oldest request in the window expires
    const oldestTimestamp = timestamps[0];
    const waitTime = oldestTimestamp + windowMs - now + 1; // +1ms to ensure we're past the window

    return Math.max(0, waitTime);
  }

  /**
   * Parse Retry-After header value.
   * Supports both seconds (integer) and HTTP-date formats.
   *
   * @param retryAfter - Header value
   * @returns Delay in milliseconds, or null if parsing fails
   */
  private parseRetryAfter(retryAfter: string): number | null {
    // Try parsing as seconds (integer)
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds) && seconds >= 0) {
      return seconds * 1000;
    }

    // Try parsing as HTTP-date
    const date = Date.parse(retryAfter);
    if (!isNaN(date)) {
      const delay = date - Date.now();
      return Math.max(0, delay);
    }

    return null;
  }

  /**
   * Sleep helper.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
