# Contributing

Thank you for your interest in contributing to Productive.io Tools!

## Getting Started

```bash
git clone https://github.com/studiometa/productive-tools.git
cd productive-tools
npm install
npm run build
```

## Development

### Workspace Commands

```bash
npm run build          # Build all packages (in dependency order)
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run typecheck      # Type check all packages
npm run lint           # Lint with oxlint
npm run format         # Format with oxfmt
npm run clean          # Remove dist/ and node_modules/
```

### Working on a Specific Package

```bash
npm run build -w @studiometa/productive-cli
npm run test -w @studiometa/productive-mcp
npm run dev -w @studiometa/productive-cli
```

### Package Dependency Order

Build order matters — packages depend on each other:

```
api → core → cli
               ↘
api → core → mcp
```

The root `npm run build` handles this automatically.

### Running the CLI Locally

```bash
npm run build -w @studiometa/productive-cli
./packages/cli/dist/cli.js --help

# Or link globally
npm link -w @studiometa/productive-cli
productive --help
```

## Project Structure

```
productive-tools/
├── packages/
│   ├── api/       # @studiometa/productive-api — API client, types, formatters
│   ├── core/      # @studiometa/productive-core — Executor functions, resolvers
│   ├── cli/       # @studiometa/productive-cli — CLI tool
│   └── mcp/       # @studiometa/productive-mcp — MCP server (stdio + HTTP)
├── .changelog/    # Changelog fragments, folded into CHANGELOG.md at release
├── CHANGELOG.md   # Single changelog for the entire monorepo
├── CLAUDE.md      # AI agent instructions
└── package.json   # Root workspace config
```

## Code Style

- **Zero runtime dependencies** — use native Node.js APIs (`node:fs`, `node:crypto`, etc.)
- **TypeScript** — all code must be properly typed
- **ESM only** — no CommonJS
- **Functional style** — prefer pure functions, inject dependencies via context
- **oxlint + oxfmt** — run `npm run lint` and `npm run format` before committing

## Testing

All packages use Vitest:

```bash
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:ci           # With coverage
```

Mock API calls in tests. The `@studiometa/productive-core` package provides `createTestExecutorContext()` for easy test setup.

## Commit Messages

Use simple verb-first sentences in English:

```
Add time entry validation
Fix project list pagination
Update MCP tool schema
```

Always add the co-author trailer:

```
Co-authored-by: Claude <claude@anthropic.com>
```

## Versioning

All packages share one version. Maintainers release with the `Release` workflow (`.github/workflows/publish.yml`), which tests, bumps the version, folds the changelog fragments into `CHANGELOG.md`, tags (no `v` prefix), publishes to npm and creates the GitHub release:

```bash
gh workflow run publish.yml -f bump=patch   # or minor / major
```

## Changelog

Do not edit `CHANGELOG.md`. Add a fragment in `.changelog/<slug>.md`, where the slug is your branch name without its prefix. Use `###` Keep a Changelog sections and prefix entries with the package name when relevant:

```markdown
### Added

- **CLI**: Add bookings command

### Fixed

- **MCP**: Fix OAuth token refresh
```

Do not write the pull request number: the release adds it. A pull request that changes `packages/` needs a fragment, unless it has the `no-changelog` label. See [`weareikko/changelog`](https://github.com/weareikko/changelog) for the format.

## Pull Request Process

1. Create a feature branch
2. Make changes and add tests
3. Run checks: `npm run typecheck && npm run lint && npm test && npm run build`
4. Add a fragment in `.changelog/`
5. Open a pull request with a clear description

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
