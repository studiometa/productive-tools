/**
 * Dry-run fetch interceptor for `productive run --dry-run`.
 *
 * When dry-run mode is active, mutating HTTP requests (POST, PATCH, PUT,
 * DELETE) are recorded instead of sent. Read-only requests (GET, HEAD) pass
 * through normally so the script can still fetch data it needs.
 *
 * Usage inside the wrapper:
 *
 *   import { createDryRunFetch, printDryRunSummary } from './script.js';
 *
 *   const calls: DryRunCall[] = [];
 *   globalThis.fetch = createDryRunFetch(calls, globalThis.fetch);
 *   // ... run script ...
 *   printDryRunSummary(calls, output);
 */

/** A recorded mutating API call. */
export interface DryRunCall {
  method: string;
  url: string;
  body?: unknown;
}

/** HTTP methods that are intercepted in dry-run mode. */
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Create a fetch wrapper that intercepts mutating requests.
 *
 * @param calls   - Array to push recorded calls into.
 * @param real    - The real fetch function to call for read-only requests.
 */
export function createDryRunFetch(
  calls: DryRunCall[],
  real: typeof globalThis.fetch,
): typeof globalThis.fetch {
  return async (
    input: Parameters<typeof globalThis.fetch>[0],
    init?: RequestInit,
  ): Promise<Response> => {
    const method = (init?.method ?? 'GET').toUpperCase();
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

    // Read-only: pass through
    if (!MUTATING_METHODS.has(method)) {
      return real(input, init);
    }

    // Mutating: record and return a fake response
    let body: unknown;
    if (init?.body != null) {
      try {
        body = JSON.parse(typeof init.body === 'string' ? init.body : String(init.body)) as unknown;
      } catch {
        body = init.body;
      }
    }

    calls.push({ method, url, body });

    // Return an empty success response so the SDK doesn't throw
    const status = method === 'POST' ? 201 : 200;
    const responseData = body != null && typeof body === 'object' ? body : {};
    return new Response(JSON.stringify({ data: responseData }), {
      status,
      headers: { 'Content-Type': 'application/vnd.api+json' },
    });
  };
}

/** Output interface subset used by the summary printer. */
interface SummaryOutput {
  warn(msg: string): void;
  table(data: object[]): void;
  info(msg: string): void;
}

/**
 * Print a human-readable summary of recorded dry-run calls.
 *
 * Outputs a table with the HTTP method and URL for each recorded call,
 * or a notice if no mutating calls were made.
 */
export function printDryRunSummary(calls: DryRunCall[], output: SummaryOutput): void {
  if (calls.length === 0) {
    output.info('Dry run complete — no mutating API calls would have been made.');
    return;
  }

  const plural = calls.length === 1 ? 'call' : 'calls';
  output.warn(`Dry run: ${calls.length} mutating ${plural} recorded (not executed):`);
  output.table(calls.map((c) => ({ method: c.method, url: c.url })));
}
