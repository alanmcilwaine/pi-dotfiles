# pi-dotfiles

This one is mine.

### Install

```bash
# Linux/MacOS
sh -c "$(curl -fsLS https://get.chezmoi.io/lb)" -- -S "$HOME/.local/share/chezmoi-pi" init --apply alanmcilwaine/pi-dotfiles

# Windows
iex "&{$(irm 'https://get.chezmoi.io/ps1')}"; chezmoi -S "$HOME/.local/share/chezmoi-pi" init --apply alanmcilwaine/pi-dotfiles
```

### Update

```bash
chezmoi -S "$HOME/.local/share/chezmoi-pi" update
chezmoi -S "$HOME/.local/share/chezmoi-pi" -R update # Force trigger update
```
