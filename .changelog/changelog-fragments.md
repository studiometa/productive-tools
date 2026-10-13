### Changed

- **CI**: Replace the `## [Unreleased]` section with `.changelog/` fragments checked on pull requests by `weareikko/changelog`, and release each merge into `main` with a `Release` workflow that bumps the version from the fragments, folds them into `CHANGELOG.md`, tags and publishes
