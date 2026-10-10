import { EventEmitter } from 'node:events';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { readStdin, clearStdinCache } from './stdin.js';

describe('readStdin', () => {
  let mockStdin: EventEmitter;
  let originalStdin: any;
  let originalIsTTY: boolean;

  beforeEach(() => {
    // Clear stdin cache before each test
    clearStdinCache();

    mockStdin = new EventEmitter();
    originalStdin = process.stdin;
    originalIsTTY = process.stdin.isTTY;

    // Mock process.stdin
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      writable: true,
      configurable: true,
    });

    // Add required methods to mockStdin
    (mockStdin as any).resume = vi.fn();
    (mockStdin as any).isTTY = false;
  });

  afterEach(() => {
    // Restore original stdin
    Object.defineProperty(process, 'stdin', {
      value: originalStdin,
      writable: true,
      configurable: true,
    });
    process.stdin.isTTY = originalIsTTY;
  });

  it('should read data from stdin', async () => {
    const testData = 'test data from stdin';

    const readPromise = readStdin();

    // Simulate stdin data
    process.nextTick(() => {
      mockStdin.emit('data', Buffer.from(testData));
      mockStdin.emit('end');
    });

    const result = await readPromise;
    expect(result).toBe(testData);
  });

  it('should concatenate multiple data chunks', async () => {
    const chunk1 = 'first chunk ';
    const chunk2 = 'second chunk';

    const readPromise = readStdin();

    // Simulate multiple stdin chunks
    process.nextTick(() => {
      mockStdin.emit('data', Buffer.from(chunk1));
      mockStdin.emit('data', Buffer.from(chunk2));
      mockStdin.emit('end');
    });

    const result = await readPromise;
    expect(result).toBe('first chunk second chunk');
  });

  it('should handle empty stdin', async () => {
    const readPromise = readStdin();

    // Simulate empty stdin
    process.nextTick(() => {
      mockStdin.emit('end');
    });

    const result = await readPromise;
    expect(result).toBe('');
  });

  it('should throw error when stdin is a TTY', async () => {
    (process.stdin as any).isTTY = true;

    await expect(readStdin()).rejects.toThrow(
      'Reading from stdin requires piped input (stdin is a terminal). Use: echo "data" | productive ... or productive ... < file.json',
    );
  });

  it('should handle stdin errors', async () => {
    const readPromise = readStdin();

    // Simulate stdin error
    process.nextTick(() => {
      mockStdin.emit('error', new Error('Test error'));
    });

    await expect(readPromise).rejects.toThrow('Failed to read from stdin: Test error');
  });

  it('should call resume on stdin', async () => {
    const resumeSpy = vi.fn();
    (mockStdin as any).resume = resumeSpy;

    const readPromise = readStdin();

    // Simulate stdin data
    process.nextTick(() => {
      mockStdin.emit('data', Buffer.from('test'));
      mockStdin.emit('end');
    });

    await readPromise;

    expect(resumeSpy).toHaveBeenCalled();
  });

  it('should handle unicode data correctly', async () => {
    const testData = 'Hello 世界 🌍';

    const readPromise = readStdin();

    // Simulate stdin data with unicode
    process.nextTick(() => {
      mockStdin.emit('data', Buffer.from(testData, 'utf-8'));
      mockStdin.emit('end');
    });

    const result = await readPromise;
    expect(result).toBe(testData);
  });

  it('should handle large data chunks', async () => {
    const largeData = 'x'.repeat(10000);

    const readPromise = readStdin();

    // Simulate large stdin data
    process.nextTick(() => {
      mockStdin.emit('data', Buffer.from(largeData));
      mockStdin.emit('end');
    });

    const result = await readPromise;
    expect(result).toBe(largeData);
  });

  it('should cache stdin content for multiple reads', async () => {
    const testData = 'cached data';

    // First read
    const readPromise1 = readStdin();

    // Simulate stdin data
    process.nextTick(() => {
      mockStdin.emit('data', Buffer.from(testData));
      mockStdin.emit('end');
    });

    const result1 = await readPromise1;
    expect(result1).toBe(testData);

    // Second read should return cached result immediately
    const result2 = await readStdin();
    expect(result2).toBe(testData);

    // Third read should also return cached result
    const result3 = await readStdin();
    expect(result3).toBe(testData);
  });

  it('should clear cache properly', () => {
    // Start a read (we don't wait for it, just testing cache clearing)
    readStdin();

    // Clear the cache
    clearStdinCache();

    // Next read should be fresh (this test just verifies the cache mechanism exists)
    expect(() => clearStdinCache()).not.toThrow();
  });
});
