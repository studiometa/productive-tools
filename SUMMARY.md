# @studiometa/productive-cli - Project Summary

## 📊 Project Statistics

- **Total Lines of Code**: ~2,300 lines of TypeScript
- **Bundle Size**: 316KB (unminified with source maps)
- **Runtime Dependencies**: **0** (zero!)
- **Dev Dependencies**: 5 (TypeScript, Vite, Vitest, oxlint)
- **Node.js Version**: 24+
- **Build Time**: ~400ms
- **Package Type**: ESM only

## ✨ Key Features

### 1. Zero Runtime Dependencies
Built entirely with native Node.js APIs:
- Custom argument parser (replaces commander)
- Custom ANSI color system (replaces chalk)
- Custom loading spinner (replaces ora)
- XDG-compliant config store (replaces conf)
- Native fetch for HTTP requests

### 2. AI Agent Optimized
- **JSON output format** - Structured, parseable data
- **Consistent error format** - Standardized error responses
- **Exit codes** - 0 for success, 1 for errors
- **No interactive prompts** - Fully scriptable
- **Multiple formats** - json, csv, table, human

### 3. Human Friendly
- Beautiful ANSI colored output
- Loading spinners for long operations
- Helpful error messages
- Comprehensive help system
- Short command aliases (p, t, svc)

### 4. XDG Compliant
Respects user preferences for config location:
- Linux: `$XDG_CONFIG_HOME/productive-cli/config.json`
- macOS: `$XDG_CONFIG_HOME` or `~/Library/Application Support`
- Windows: `%APPDATA%\productive-cli\config.json`

## 🏗️ Architecture

### Commands
- **config** - Configuration management
- **projects** - Project listing and details
- **time** - Time entry CRUD operations
- **tasks** - Task listing and details
- **people** - People listing and details
- **services** - Service listing
- **budgets** - Budget listing

### Core Components

#### API Client (`src/api.ts`)
- Type-safe Productive.io API client
- Uses native fetch
- Supports pagination, filtering, sorting
- Consistent error handling

#### Output Formatter (`src/output.ts`)
- Formats data for different audiences
- JSON for AI agents
- CSV/Table for data export
- Human-readable for terminal users

#### Configuration (`src/config.ts`)
- XDG-compliant storage
- Environment variable support
- Secure token masking

#### Utilities (`src/utils/`)
- **args.ts** - Command-line argument parser
- **colors.ts** - ANSI terminal colors
- **spinner.ts** - Loading animation
- **config-store.ts** - Persistent config storage

## 🎯 Design Principles

### 1. Native First
Use native Node.js APIs whenever possible. Only add dependencies for build/dev tools.

### 2. User Choice
Respect user environment:
- XDG_CONFIG_HOME for config location
- NO_COLOR for color preference
- Environment variables for credentials

### 3. Dual Interface
Optimize for both humans and machines:
- Beautiful output for humans
- Structured JSON for AI/scripts

### 4. Type Safety
Full TypeScript coverage with strict mode enabled.

### 5. Fast Build
Use Vite for fast, modern ESM builds.

## 📦 Distribution

### NPM Package
```json
{
  "name": "@studiometa/productive-cli",
  "type": "module",
  "bin": {
    "productive": "./dist/cli.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

### Installation
```bash
npm install -g @studiometa/productive-cli
# or
npx @studiometa/productive-cli
```

## 🧪 Testing

- **Framework**: Vitest
- **Coverage**: v8 provider
- **Mocking**: API calls mocked in tests
- **CI**: GitHub Actions on push/PR

## 📚 Documentation

1. **README.md** - Main documentation
2. **AGENTS.md** - Detailed guide for AI agents and automation
3. **CONTRIBUTING.md** - Contribution guidelines
4. **CHANGELOG.md** - Version history
5. **PROJECT_STRUCTURE.md** - Architecture overview

## 🚀 Usage Examples

### For Humans
```bash
# Configure
productive config set apiToken YOUR_TOKEN
productive config set organizationId YOUR_ORG_ID
productive config set userId YOUR_USER_ID

# Use
productive projects list
productive time add --service 123 --time 480 --note "Work"
productive p ls --archived
```

### For AI Agents
```bash
# Get structured JSON
productive projects list --format json

# Filter and paginate
productive time list \
  --from 2024-01-01 \
  --to 2024-01-31 \
  --format json \
  --size 1000

# Create resources
productive time add \
  --service 123 \
  --time 480 \
  --note "AI task" \
  --format json
```

## 🔒 Security

- **No credentials in code** - Uses environment variables or secure config
- **Token masking** - API tokens hidden in output
- **XDG compliance** - Secure config location
- **Zero dependencies** - Fewer attack vectors

## 🎓 Learning Resources

The project demonstrates:
- Native Node.js API usage
- TypeScript best practices
- CLI design patterns
- ESM module structure
- Vite build configuration
- GitHub Actions CI/CD
- XDG Base Directory spec
- ANSI escape codes
- Command-line argument parsing

## 📈 Future Enhancements

Potential additions:
- More resource types (deals, invoices, etc.)
- Batch operations
- Configuration profiles
- Interactive mode
- Shell completions
- Docker image
- Homebrew formula

## 🙏 Credits

Built with ❤️ by [Studio Meta](https://www.studiometa.fr/)

**Technology Stack:**
- Node.js 24 (native APIs)
- TypeScript 5
- Vite 6
- Vitest 2
- oxlint (Rust-based linter)

## 📝 License

MIT License - see LICENSE file for details

---

**Repository**: https://github.com/studiometa/productive-cli
**NPM Package**: https://www.npmjs.com/package/@studiometa/productive-cli
**Productive.io API**: https://developer.productive.io/
