# Traitor Keys – Emacs Ctrl in Vim

Traitor Keys injects Emacs-style **Ctrl-f/b/n/p/a/e** motions into Obsidian's Vim key bindings, but only when you're in **Insert** or **Visual (character)** mode. It leaves Normal, Visual Line, and Visual Block untouched so Vim fundamentals stay intact.

## Requirements

- Obsidian 1.x using the Live Preview (CodeMirror 6) editor
- Core Settings → Editor → **Vim key bindings** turned on

## Installation

Install this plugin like any other community plugin: download it from its repository (or via BRAT), place the files in your vault's `.obsidian/plugins/obsidian-traitor-keys/` folder, and enable it in Obsidian.

## Usage

- In Vim **Insert** or **Visual (character)** mode, use the following Ctrl motions:
  - `Ctrl-f`: move/select right
  - `Ctrl-b`: move/select left
  - `Ctrl-n`: move/select down
  - `Ctrl-p`: move/select up
  - `Ctrl-a`: move/select to line start
  - `Ctrl-e`: move/select to line end
- Toggle the plugin from the Command Palette via **"Traitor Keys: Toggle Emacs Ctrl in Vim"**.
- When enabled in settings, a status bar indicator shows `TK:ON` or `TK:OFF`; click it to toggle.

## Known limitations

- Does **not** operate in Normal mode, Visual Line, or Visual Block; those keys fall back to Vim/Obsidian defaults.
- OS or Obsidian hotkeys may intercept `Ctrl-f` and others before they reach the editor.
- Relies on the Vim extension's internal state (`state.vim`); upstream changes could break detection logic.

## Troubleshooting

If `Ctrl-f` still triggers search or otherwise misbehaves:

- Verify Vim key bindings are enabled in Obsidian's settings.
- Check for conflicting hotkeys or mappings from other plugins (e.g., Vimrc Support) that may override the keys.

To resolve conflicts with Vimrc Support or similar plugins, remove or adjust any `Ctrl-f/b/n/p/a/e` mappings in your `.obsidian.vimrc` or set up priority to your preference.

## Development

Use either npm or Yarn to install dependencies and build the plugin bundle:

- `npm install` or `yarn install`
- `npm run build` or `yarn build`

Yarn installs are configured to use the `node_modules` linker for compatibility with Obsidian's build tooling.
