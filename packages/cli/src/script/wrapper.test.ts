import { describe, expect, it } from 'vitest';

import { generateResolverHooks, generateWrapper } from './wrapper.js';

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
    expect(code).toContain(`import { Productive } from ${JSON.stringify(OPTS.sdkUrl)}`);
  });

  it('embeds the scriptOutputUrl in the helper imports', () => {
    const code = generateWrapper(OPTS);
    expect(code).toContain(OPTS.scriptOutputUrl);
  });

  it('embeds the scriptUrl in the dynamic import', () => {
    const code = generateWrapper(OPTS);
    expect(code).toContain(`await import(${JSON.stringify(OPTS.scriptUrl)})`);
  });

  it('escapes URLs so a path with a single quote cannot break the generated module', () => {
    const scriptUrl = "file:///home/u/o'brien/report.ts";
    const hooksUrl = "file:///tmp/o'brien/resolver-hooks.mjs";
    const code = generateWrapper({ ...OPTS, scriptUrl, hooksUrl });
    // The raw apostrophe must not appear inside a single-quoted literal; the
    // generated code uses JSON (double-quoted) string literals instead.
    expect(code).toContain(`await import(${JSON.stringify(scriptUrl)})`);
    expect(code).toContain(`register(${JSON.stringify(hooksUrl)}, import.meta.url)`);
    expect(code).not.toContain(`'${scriptUrl}'`);
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

  it('does not register resolver hooks when no hooksUrl is given', () => {
    const code = generateWrapper(OPTS);
    expect(code).not.toContain("import { register } from 'node:module'");
    expect(code).not.toContain('register(');
  });

  it('registers the resolver hooks before importing the user script when hooksUrl is given', () => {
    const hooksUrl = 'file:///tmp/productive-script-abc/resolver-hooks.mjs';
    const code = generateWrapper({ ...OPTS, hooksUrl });
    expect(code).toContain("import { register } from 'node:module'");
    expect(code).toContain(`register(${JSON.stringify(hooksUrl)}, import.meta.url)`);
    // The register call must precede the dynamic import of the user script.
    expect(code.indexOf('register(')).toBeLessThan(
      code.indexOf(`await import(${JSON.stringify(OPTS.scriptUrl)})`),
    );
  });
});

describe('generateResolverHooks', () => {
  const MAP = {
    '@studiometa/productive-cli': 'file:///cli/dist/index.js',
    '@studiometa/productive-cli/script': 'file:///cli/dist/script.js',
    '@studiometa/productive-sdk': 'file:///sdk/dist/index.js',
  };

  it('exports an async resolve hook', () => {
    const code = generateResolverHooks(MAP);
    expect(code).toContain('export async function resolve(specifier, context, nextResolve)');
  });

  it('embeds every mapped specifier and its target URL', () => {
    const code = generateResolverHooks(MAP);
    for (const [specifier, url] of Object.entries(MAP)) {
      expect(code).toContain(specifier);
      expect(code).toContain(url);
    }
  });

  it('short-circuits mapped specifiers and falls through unknown ones', () => {
    const code = generateResolverHooks(MAP);
    expect(code).toContain('shortCircuit: true');
    expect(code).toContain('return nextResolve(specifier, context)');
  });

  it('produces an evaluable module whose map matches the input', async () => {
    const code = generateResolverHooks(MAP);
    const mod = await import(`data:text/javascript,${encodeURIComponent(code)}`);
    const next = (specifier: string) => ({ url: `default:${specifier}` });

    // Mapped specifier → short-circuited to the absolute URL.
    await expect(mod.resolve('@studiometa/productive-cli/script', {}, next)).resolves.toEqual({
      url: MAP['@studiometa/productive-cli/script'],
      shortCircuit: true,
    });

    // Unknown specifier → delegated to nextResolve.
    await expect(mod.resolve('node:fs', {}, next)).resolves.toEqual({ url: 'default:node:fs' });
  });
});
