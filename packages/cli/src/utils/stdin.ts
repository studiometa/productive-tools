import { ValidationError } from '../errors.js';

// Cache to store stdin content once read
let stdinCache: Promise<string> | null = null;

/**
 * Read data from stdin (cached after first read)
 * @returns Promise that resolves to the stdin content as a string
 */
export async function readStdin(): Promise<string> {
  // Return cached result if stdin was already read
  if (stdinCache) {
    return stdinCache;
  }

  // Check if stdin is a TTY (terminal)
  if (process.stdin.isTTY) {
    throw new ValidationError(
      'Reading from stdin requires piped input (stdin is a terminal). Use: echo "data" | productive ... or productive ... < file.json',
      'stdin',
    );
  }

  // Create and cache the promise
  stdinCache = new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    process.stdin.on('data', (chunk) => {
      chunks.push(chunk);
    });

    process.stdin.on('end', () => {
      const content = Buffer.concat(chunks).toString('utf-8');
      resolve(content);
    });

    process.stdin.on('error', (error) => {
      reject(new ValidationError(`Failed to read from stdin: ${error.message}`, 'stdin'));
    });

    // Resume stdin in case it's in paused mode
    process.stdin.resume();
  });

  return stdinCache;
}

/**
 * Clear the stdin cache (primarily for testing)
 */
export function clearStdinCache(): void {
  stdinCache = null;
}
