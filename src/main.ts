import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";
import { keymap, type EditorView } from "@codemirror/view";
import { Prec, type Extension } from "@codemirror/state";
import {
  cursorCharLeft,
  cursorCharRight,
  cursorLineDown,
  cursorLineEnd,
  cursorLineStart,
  cursorLineUp,
  selectCharLeft,
  selectCharRight,
  selectLineDown,
  selectLineEnd,
  selectLineStart,
  selectLineUp,
} from "@codemirror/commands";

interface TraitorKeysSettings {
  enabled: boolean;
  showStatusBar: boolean;
}

const DEFAULT_SETTINGS: TraitorKeysSettings = {
  enabled: true,
  showStatusBar: true,
};

type VimMode =
  | "normal"
  | "insert"
  | "visual-char"
  | "visual-line"
  | "visual-block"
  | "unknown";

function getVimMode(view: EditorView): VimMode {
  const cm = (view as any).cm ?? view;
  const vimState = cm?.state?.vim;
  if (!vimState) return "unknown";

  const modeName =
    typeof vimState.mode === "string"
      ? vimState.mode
      : typeof vimState.mode?.name === "string"
        ? vimState.mode.name
        : null;

  if (modeName === "insert") return "insert";
  if (modeName === "visual") {
    if (vimState.visualLine) return "visual-line";
    if (vimState.visualBlock) return "visual-block";
    return "visual-char";
  }

  if (vimState.insertMode) return "insert";
  if (vimState.visualMode) {
    if (vimState.visualLine) return "visual-line";
    if (vimState.visualBlock) return "visual-block";
    return "visual-char";
  }
  return "normal";
}

type MotionKind =
  | "charRight"
  | "charLeft"
  | "lineDown"
  | "lineUp"
  | "lineStart"
  | "lineEnd";

function pickCmCommand(
  kind: MotionKind,
  mode: VimMode
): ((view: EditorView) => boolean) | null {
  const isInsert = mode === "insert";
  const isVisual = mode === "visual-char";

  if (!isInsert && !isVisual) return null;

  if (isInsert) {
    switch (kind) {
      case "charRight":
        return cursorCharRight;
      case "charLeft":
        return cursorCharLeft;
      case "lineDown":
        return cursorLineDown;
      case "lineUp":
        return cursorLineUp;
      case "lineStart":
        return cursorLineStart;
      case "lineEnd":
        return cursorLineEnd;
    }
  } else {
    switch (kind) {
      case "charRight":
        return selectCharRight;
      case "charLeft":
        return selectCharLeft;
      case "lineDown":
        return selectLineDown;
      case "lineUp":
        return selectLineUp;
      case "lineStart":
        return selectLineStart;
      case "lineEnd":
        return selectLineEnd;
    }
  }

  return null;
}

function makeMotionHandler(plugin: TraitorKeysPlugin, kind: MotionKind) {
  return (view: EditorView): boolean => {
    if (!plugin.settings.enabled) return false;
    if ((view as any).composing) return false;

    const mode = getVimMode(view);
    if (mode === "normal" || mode === "unknown") return false;
    if (mode !== "insert" && mode !== "visual-char") return false;

    const command = pickCmCommand(kind, mode);
    if (!command) return false;

    return command(view);
  };
}

class TraitorKeysSettingTab extends PluginSettingTab {
  plugin: TraitorKeysPlugin;

  constructor(app: App, plugin: TraitorKeysPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Traitor Keys – Emacs Ctrl in Vim" });

    new Setting(containerEl)
      .setName("Enable Traitor Keys")
      .setDesc("Toggle Emacs-style Ctrl motions in Vim insert/visual-char modes.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enabled)
          .onChange(async (value) => {
            this.plugin.settings.enabled = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show status bar indicator")
      .setDesc("Display TK:ON / TK:OFF in the status bar and allow clicking to toggle.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showStatusBar)
          .onChange(async (value) => {
            this.plugin.settings.showStatusBar = value;
            await this.plugin.saveSettings();
            this.plugin.updateStatusBarVisibility();
          })
      );
  }
}

export default class TraitorKeysPlugin extends Plugin {
  settings: TraitorKeysSettings = DEFAULT_SETTINGS;
  statusBarItem?: HTMLElement;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new TraitorKeysSettingTab(this.app, this));
    this.registerCommands();
    this.updateStatusBarVisibility();

    const extension = this.buildEditorExtension();
    this.registerEditorExtension(extension);
  }

  onunload() {
    this.statusBarItem = undefined;
  }

  buildEditorExtension(): Extension {
    const bindings = [
      { key: "Ctrl-f", run: makeMotionHandler(this, "charRight") },
      { key: "Ctrl-b", run: makeMotionHandler(this, "charLeft") },
      { key: "Ctrl-n", run: makeMotionHandler(this, "lineDown") },
      { key: "Ctrl-p", run: makeMotionHandler(this, "lineUp") },
      { key: "Ctrl-a", run: makeMotionHandler(this, "lineStart") },
      { key: "Ctrl-e", run: makeMotionHandler(this, "lineEnd") },
    ];

    return Prec.highest(keymap.of(bindings));
  }

  registerCommands() {
    this.addCommand({
      id: "traitor-keys-toggle",
      name: "Traitor Keys: Toggle Emacs Ctrl in Vim",
      callback: () => this.toggleEnabled(),
    });
  }

  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateStatusBar();
  }

  toggleEnabled() {
    this.settings.enabled = !this.settings.enabled;
    void this.saveSettings();
  }

  initStatusBar() {
    const el = this.addStatusBarItem();
    this.statusBarItem = el;
    el.addClass("traitor-keys-status");
    el.onclick = () => this.toggleEnabled();
    this.updateStatusBar();
  }

  updateStatusBar() {
    if (!this.statusBarItem) return;
    this.statusBarItem.setText(this.settings.enabled ? "TK:ON" : "TK:OFF");
  }

  updateStatusBarVisibility() {
    if (this.settings.showStatusBar) {
      if (!this.statusBarItem) {
        this.initStatusBar();
      } else {
        this.updateStatusBar();
      }
    } else if (this.statusBarItem) {
      this.statusBarItem.remove();
      this.statusBarItem = undefined;
    }
  }
}
