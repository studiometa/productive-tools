# Contributing to @studiometa/productive-cli

Thank you for your interest in contributing to the Productive CLI! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/productive-cli.git
   cd productive-cli
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Building

```bash
# Build the project
npm run build

# Watch mode for development
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:ci

# Watch mode
npm test -- --watch
```

### Linting and Formatting

```bash
# Lint with oxlint
npm run lint

# Format code with oxc
npm run format

# Check formatting
npm run format:check

# Type check
npm run typecheck
```

### Running the CLI Locally

```bash
# After building
./dist/cli.js --help

# Or link it globally
npm link
productive --help
```

## Code Style

- **Use native Node.js APIs** - Avoid third-party dependencies when possible
- **Use node: prefix** for built-in modules (e.g., `node:fs`, `node:path`)
- **TypeScript** - All code should be properly typed
- **ESM modules** - Use ES modules syntax
- **Functional style** - Prefer pure functions where possible

### File Structure

```
src/
├── commands/        # Command implementations
│   ├── config.ts
│   ├── projects.ts
│   ├── time.ts
│   └── ...
├── utils/           # Utility functions
│   ├── args.ts      # Argument parsing
│   ├── colors.ts    # ANSI colors
│   ├── spinner.ts   # Loading spinner
│   └── config-store.ts  # Configuration storage
├── api.ts           # Productive.io API client
├── config.ts        # Configuration management
├── output.ts        # Output formatting
├── types.ts         # TypeScript types
├── cli.ts           # CLI entry point
└── index.ts         # Library entry point
```

## Adding a New Command

1. Create a new file in `src/commands/`:

   ```typescript
   import { ProductiveApi, ProductiveApiError } from '../api.js';
   import { OutputFormatter, createSpinner } from '../output.js';
   import { colors } from '../utils/colors.js';
   import type { OutputFormat } from '../types.js';

   export async function handleYourCommand(
     subcommand: string,
     args: string[],
     options: Record<string, string | boolean>,
   ): Promise<void> {
     const format = (options.format || options.f || 'human') as OutputFormat;
     const formatter = new OutputFormatter(format, options['no-color'] === true);

     // Implementation
   }
   ```

2. Add the command to `src/cli.ts`:

   ```typescript
   import { handleYourCommand } from './commands/your-command.js';

   // In the switch statement:
   case 'your-command':
     await handleYourCommand(subcommand || 'list', positional, options);
     break;
   ```

3. Update the help text in `src/cli.ts`

4. Add tests for your command

5. Update README.md with usage examples

## Adding a New API Method

1. Add the TypeScript type to `src/types.ts`:

   ```typescript
   export interface ProductiveYourResource {
     id: string;
     type: 'your_resources';
     attributes: {
       // ...
     };
   }
   ```

2. Add the method to `src/api.ts`:

   ```typescript
   async getYourResources(params?: {
     page?: number;
     perPage?: number;
     filter?: Record<string, string>;
     sort?: string;
   }): Promise<ProductiveApiResponse<ProductiveYourResource[]>> {
     const query: Record<string, string> = {};

     if (params?.page) query['page[number]'] = String(params.page);
     if (params?.perPage) query['page[size]'] = String(params.perPage);
     if (params?.sort) query['sort'] = params.sort;
     if (params?.filter) {
       Object.entries(params.filter).forEach(([key, value]) => {
         query[`filter[${key}]`] = value;
       });
     }

     return this.request<ProductiveApiResponse<ProductiveYourResource[]>>(
       '/your_resources',
       { query }
     );
   }
   ```

3. Export the type from `src/index.ts`

## Testing Guidelines

- Write tests for all new features
- Maintain or improve code coverage
- Test both human and JSON output formats
- Mock API calls in tests
- Test error handling

Example test:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { handleYourCommand } from '../commands/your-command.js';

vi.mock('../api.js');

describe('yourCommand', () => {
  it('should list resources', async () => {
    // Test implementation
  });
});
```

## Documentation

- Update README.md with new features
- Add JSDoc comments for public APIs
- Update CHANGELOG.md
- Update AGENTS.md if relevant for AI agents

## Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or tooling changes

Examples:

```
feat(projects): add archive command
fix(time): handle missing service ID error
docs(readme): update configuration examples
```

## Pull Request Process

1. **Update documentation** - Ensure README.md and other docs are up to date
2. **Add tests** - Include tests for new features
3. **Run all checks**:
   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm test
   npm run build
   ```
4. **Update CHANGELOG.md** - Add your changes under "Unreleased"
5. **Create pull request** with a clear description of changes
6. **Respond to review** feedback

## Questions or Issues?

- Open an issue for bugs or feature requests
- Start a discussion for questions
- Contact the maintainers via email

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🙏
