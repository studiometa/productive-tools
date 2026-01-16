# Deployment Guide

## 📦 Repository Setup

The repository has been initialized and committed locally. To push to GitHub:

### Option 1: Using SSH (if you have SSH keys set up)

```bash
cd /home/titouan/github.com/studiometa/productive-cli

# Push to GitHub
git push -u origin main
```

### Option 2: Using HTTPS

```bash
cd /home/titouan/github.com/studiometa/productive-cli

# Change remote to HTTPS
git remote set-url origin https://github.com/studiometa/productive-cli.git

# Push to GitHub
git push -u origin main
```

## 🚀 Publishing to npm

Once the repository is pushed to GitHub:

### 1. Verify Everything Works

```bash
# Run all checks
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build

# Test the CLI
./dist/cli.js --help
./test-cli.sh
```

### 2. Login to npm

```bash
npm login
```

### 3. Publish

```bash
# Dry run to see what will be published
npm publish --dry-run

# Actually publish
npm publish --access public
```

### 4. Verify Publication

```bash
# Test installation from npm
npx @studiometa/productive-cli@latest --version
```

## 🏷️ Creating Releases

### 1. Create a Git Tag

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

### 2. Create GitHub Release

Go to https://github.com/studiometa/productive-cli/releases/new

- Tag: `v0.1.0`
- Title: `v0.1.0 - Initial Release`
- Description: Copy from CHANGELOG.md
- Check "Set as the latest release"

## 📋 Pre-Publish Checklist

- [x] All source files created
- [x] TypeScript builds successfully
- [x] CLI executable works
- [x] Tests configured (Vitest)
- [x] Linting configured (oxlint)
- [x] CI/CD configured (GitHub Actions)
- [x] Documentation complete (README, CONTRIBUTING, etc.)
- [x] License file (MIT)
- [x] .gitignore and .npmignore configured
- [x] package.json metadata correct
- [ ] Git repository pushed to GitHub
- [ ] GitHub repository configured (description, topics, etc.)
- [ ] npm package published
- [ ] GitHub release created

## 🔧 Post-Publication Tasks

### 1. Update GitHub Repository

- Add description: "CLI tool for Productive.io - optimized for AI agents and humans"
- Add topics: `cli`, `productive`, `productivity`, `api`, `typescript`, `ai-agent`, `nodejs`
- Enable issues and discussions
- Add repository URL to package.json:
  ```json
  "repository": {
    "type": "git",
    "url": "git+https://github.com/studiometa/productive-cli.git"
  },
  "bugs": {
    "url": "https://github.com/studiometa/productive-cli/issues"
  },
  "homepage": "https://github.com/studiometa/productive-cli#readme"
  ```

### 2. Create Project Documentation

Consider adding:
- GitHub Pages for documentation
- Automated release notes with Release Drafter
- Dependabot for dependency updates
- CodeQL for security scanning

### 3. Promote the Package

- Share on social media
- Add to awesome-lists
- Write a blog post
- Submit to relevant newsletters

## 🔄 Future Releases

### Versioning

Follow Semantic Versioning (semver):
- `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Process

1. Update CHANGELOG.md
2. Update version in package.json
3. Commit changes: `git commit -m "chore: bump version to X.Y.Z"`
4. Create tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
5. Push: `git push && git push --tags`
6. Publish to npm: `npm publish`
7. Create GitHub release

## 📊 Current Status

```
✅ Repository initialized
✅ Files committed locally
⏳ Waiting for: git push to GitHub
⏳ Waiting for: npm publish
```

## 🆘 Troubleshooting

### SSH Authentication Issues

If you get "Permission denied (publickey)":

1. Check if you have SSH keys: `ls -la ~/.ssh`
2. Generate new key: `ssh-keygen -t ed25519 -C "your_email@example.com"`
3. Add to ssh-agent: `eval "$(ssh-agent -s)" && ssh-add ~/.ssh/id_ed25519`
4. Add public key to GitHub: https://github.com/settings/keys
5. Test: `ssh -T git@github.com`

### HTTPS Authentication

If using HTTPS, you'll need a Personal Access Token (PAT):

1. Create PAT: https://github.com/settings/tokens
2. Use as password when prompted during `git push`

## 📝 Notes

- The initial commit hash is: `ebdd787`
- Current branch: `main`
- Package name: `@studiometa/productive-cli`
- License: MIT
- Node.js requirement: >=24.0.0
