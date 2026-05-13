# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-05-13

### Changed
- **BREAKING: Package renamed from `visionlog-md` to `governor-md`.** Same playbook as `ike-md → docket-md` (see eidos-agi/docket.md CHANGELOG v0.3.0). The trilogy is now `research.md / governor.md / docket.md`. Single rename, no codename/brand split per [feedback_no_codename_brand_splits_at_solo_scale].
- Python module: `visionlog_md/` → `governor_md/`
- CLI entry: `visionlog` → `governor`
- MCP server identity: `visionlog` → `governor`
- Brand-prefixed tools renamed: `visionlog_status` → `governor_status`, `visionlog_boot` → `governor_boot`, `visionlog_guide` → `governor_guide`
- Concept-prefixed tools UNCHANGED: `vision_set`, `vision_view`, `goal_*`, `guardrail_*`, `sop_*`, `decision_*` (these refer to the entities the tool manages, not the brand)
- Dotfile state directory: `.visionlog/` → `.governor/` (the repo migrated its own state in this commit)

### Removed
- TypeScript surface (the unpublished pre-port original at `src/`, `package.json`, `tsconfig.json`, `biome.json`). The Python port has been the published surface since 0.1.0; the TS source was a dead reference.
- Migration scaffold at `refactor/` (TS→Python port fixtures; port is complete).
- 19 tracked `*.bun-build` files (~1.1GB total) — those were Bun build artifacts that should never have been committed.

### Migration
- `visionlog-md` v0.2.0 stays on PyPI as the deprecated name (PyPI doesn't allow name reuse).
- `governor-md` v0.3.0 is the new canonical package. To migrate a project: rename `.visionlog/` → `.governor/`, edit any `.visionlog/config.yaml` → `.governor/config.yaml`, update settings allowlists from `mcp__visionlog__*` → `mcp__governor__*`. A `governor-migrate` companion script will be added in a follow-up commit.

## [0.1.0] - 2026-03-22

### Added
- Initial release
