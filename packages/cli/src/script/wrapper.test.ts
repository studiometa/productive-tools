import { describe, expect, it } from 'vitest';

import { generateWrapper } from './wrapper.js';

const OPTS = {
  scriptUrl: 'file:///home/user/scripts/my-script.ts',
  scriptOutputUrl: 'file:///usr/local/lib/productive-cli/dist/script.js',
  sdkUrl:
    'file:///usr/local/lib/productive-cli/node_modules/@studiometa/productive-sdk/dist/index.js',
};

describe('generateWrapper', () => {
  it('produces a valid ES module string', () => {
    const code = generateWrapper(OPTS);
    expect(typeof code).toBe('string');
    expect(code).toContain('import { Productive }');
    expect(code).toContain('createScriptOutput');
    expect(code).toContain('parseScriptArgs');
    expect(code).toContain('createDryRunFetch');
    expect(code).toContain('printDryRunSummary');
  });

  it('embeds the SDK URL in the Productive import', () => {
    const code = generateWrapper(OPTS);
    expect(code).toContain(`import { Productive } from '${OPTS.sdkUrl}'`);
  });

  it('embeds the scriptOutputUrl in the helper imports', () => {
    const code = generateWrapper(OPTS);
    expect(code).toContain(OPTS.scriptOutputUrl);
  });

  it('embeds the scriptUrl in the dynamic import', () => {
    const code = generateWrapper(OPTS);
    expect(code).toContain(`await import('${OPTS.scriptUrl}')`);
  });

  it('reads PRODUCTIVE_* env vars', () => {
    const code = generateWrapper(OPTS);
    expect(code).toContain('process.env.PRODUCTIVE_API_TOKEN');
    expect(code).toContain('process.env.PRODUCTIVE_ORG_ID');
    expect(code).toContain('process.env.PRODUCTIVE_USER_ID');
    expect(code).toContain('process.env.PRODUCTIVE_BASE_URL');
  });

  it('exits if token or orgId are missing', () => {
    const code = generateWrapper(OPTS);
    expect(code).toContain('process.exit(1)');
    expect(code).toContain('PRODUCTIVE_API_TOKEN and PRODUCTIVE_ORG_ID must be set');
  });

  it('sets globalThis.productive, globalThis.output, globalThis.args, globalThis.flags', () => {
    const code = generateWrapper(OPTS);
    expect(code).toContain('globalThis.productive = client');
    expect(code).toContain('globalThis.output = output');
    expect(code).toContain('globalThis.args = args');
    expect(code).toContain('globalThis.flags = flags');
  });

  it('includes dry-run mode support via PRODUCTIVE_DRY_RUN env var', () => {
    const code = generateWrapper(OPTS);
    expect(code).toContain("process.env.PRODUCTIVE_DRY_RUN === '1'");
    expect(code).toContain('createDryRunFetch');
    expect(code).toContain('printDryRunSummary');
  });

  it('calls the default export when it is a function (pattern A) with flags', () => {
    const code = generateWrapper(OPTS);
    expect(code).toContain("typeof mod.default === 'function'");
    expect(code).toContain('await mod.default({ client, output, args, flags })');
  });

  it('parses argv into args and flags via parseScriptArgs', () => {
    const code = generateWrapper(OPTS);
    expect(code).toContain('parseScriptArgs(process.argv.slice(2))');
    expect(code).toContain('const { args, flags }');
  });
});
