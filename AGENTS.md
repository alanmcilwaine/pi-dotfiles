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
