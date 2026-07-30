# AGENTS.md

This repo manages portable Pi configuration with chezmoi.

## Standard

- Prefer declarative setup.
- Prefer `.chezmoiexternal.toml` for third-party Pi resources we want everywhere.
- Prefer checked-in config overlays under `dot_pi/agent/...` over imperative post-install commands.
- Use scripts only when a tool has no durable file-based configuration.

## Layout

- `.chezmoiexternal.toml` — third-party repos pulled into the target tree
- `dot_pi/agent/...` — files that map to `~/.pi/agent/...`
  - `dot_pi/agent/extensions/<name>/...` — local config overlay for an extension
  - `dot_pi/agent/themes/...` — local themes
  - `dot_pi/agent/prompts/...` — local prompts
  - `dot_pi/agent/APPEND_SYSTEM.md` — appended Pi system instructions

## Extension code vs. config

`git-repo` externals delegate their directory to git, so chezmoi cannot merge
overlay files into the same tree and aborts with "inconsistent state". Follow
the established convention (chezmoi docs and upstream guidance):

- Use `type = "archive"` externals for third-party code that needs a config
  overlay — chezmoi manifests archive contents in its source state, so an
  overlay like `dot_pi/agent/extensions/<name>/config.json` merges cleanly
  into the same target directory.
- Use `git-repo` externals only for third-party code with no overlay.
- Leave `exact` off so extension runtime files (caches, logs) never cause
  churn; pin a tag tarball instead of a branch when a stable release is wanted.

For extensions that only read config from their install root and nowhere else,
prefer a fork with the config committed at the root, or a `run_after_` script
as a last resort.
