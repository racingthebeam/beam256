import * as uikit from "@racingthebeam/uikit";
import { B, T, bind, delegate } from "@racingthebeam/domutil";

import { EditorView, basicSetup } from "codemirror"
import { javascript } from "@codemirror/lang-javascript"

import { Toolchain } from "./toolchain";

import { Emulator } from "./emulator";
import * as Emu from "./emulator";

const toolchain = new Toolchain();

let audioContext!: AudioContext;
let audioStarted = false;
let rootWidget: Widget | null = null;

type WidgetUI = {
    root: HTMLElement,
    [key: string]: HTMLElement
};

abstract class Widget {
    _ui: WidgetUI;

    get root(): HTMLElement { return this._ui.root; }

    constructor() {
        this._ui = this._createUI();
    }

    abstract _createUI(): WidgetUI;
}

// AppPane is root application widget that hosts
// a central main widget, an an optional toolbar
// and status bar
class AppPane extends Widget {
    constructor() {
        super();
    }

    setToolbarWidget(w: Widget) {
        const wRoot = w.root;
        wRoot.classList.add("ui-app-pane--toolbar");
        this.root.append(wRoot);
    }

    setMainWidget(w: Widget) {
        const wRoot = w.root;
        wRoot.classList.add("ui-app-pane--main");
        this.root.append(wRoot);
    }

    _createUI(): WidgetUI {
        return {
            root: B(".ui-widget.ui-app-pane")
        };
    }
}

class Toolbar extends Widget {
    constructor() {
        super();
    }

    add(w: Widget) {
        const wRoot = w.root;
        wRoot.classList.add("ui-toolbar--item");
        this._ui.root.append(w.root);
    }

    _createUI(): WidgetUI {
        return {
            root: B(".ui-toolbar")
        };
    }
}

class Button extends Widget {
    onclick: (() => void) | null;

    constructor(label: string) {
        super();
        this.onclick = null;
        this._ui.root.textContent = label;
        this._ui.root.addEventListener("click", (evt) => {
            this.onclick && this.onclick();
        });
    }

    _createUI(): WidgetUI {
        return {
            root: B("button.ui-button")
        };
    }
}

class CodeEditor extends Widget {
    #editor: EditorView;

    get value(): string {
        return this.#editor.state.doc.toString();
    }

    constructor(storageKey: string) {
        super();

        const contents = localStorage.getItem(storageKey) || "";

        this.#editor = new EditorView({
            doc: contents,
            extensions: [basicSetup, javascript()],
            parent: this.root
        });

        setInterval(() => {
            localStorage.setItem(storageKey, this.#editor.state.doc.toString());
        }, 500);
    }

    _createUI(): WidgetUI {
        return {
            root: B(".ui-widget.ui-code-editor")
        };
    }
}

type EmulatorUI = {
    root: HTMLDivElement,
    chrome: HTMLDivElement,
    display: HTMLDivElement,
    canvas: HTMLCanvasElement,
    buttons: HTMLDivElement,
    up: HTMLButtonElement,
    down: HTMLButtonElement,
    left: HTMLButtonElement,
    right: HTMLButtonElement,
    a: HTMLButtonElement,
    b: HTMLButtonElement,
    x: HTMLButtonElement,
    y: HTMLButtonElement,
    start: HTMLButtonElement,
    select: HTMLButtonElement,
};

// TODO: maybe this *should* be a widget... hmmm....
function createEmulatorUI(): EmulatorUI {
    const out = {} as EmulatorUI;

    const btn = (name: string, label: string = ""): HTMLButtonElement => {
        return B(`button.emulator--button-${name}`, {
            name: name,
        }, label);
    };

    out.root = B(".emulator", [
        out.chrome = B(".emulator--chrome", { tabindex: 1 }, [
            out.display = B(".emulator--display", [
                out.canvas = B("canvas.emulator--canvas", { width: 320, height: 200 })
            ]),
            out.buttons = B(".emulator--buttons", [
                out.up = btn("up", "↑"),
                out.down = btn("down", "↓"),
                out.left = btn("left", "←"),
                out.right = btn("right", "→"),
                out.a = btn("a", "A"),
                out.b = btn("b", "B"),
                out.x = btn("x", "X"),
                out.y = btn("y", "Y"),
                out.start = btn("start", "Start"),
                out.select = btn("select", "Select")
            ])
        ])
    ]);

    return out;
}

async function runEmulator() {
    if (rootWidget) {
        rootWidget.root.setAttribute('inert', 'inert');
    }

    const eUI = createEmulatorUI();

    const keysToButtons: { [key: string]: HTMLButtonElement } = {
        "ArrowUp": eUI.up,
        "ArrowDown": eUI.down,
        "ArrowLeft": eUI.left,
        "ArrowRight": eUI.right,
        "a": eUI.a,
        "s": eUI.b,
        "z": eUI.x,
        "x": eUI.y,
        "q": eUI.start,
        "w": eUI.select,
    };

    const keysToEmulator: { [key: string]: number } = {
        "ArrowUp": Emu.Up,
        "ArrowDown": Emu.Down,
        "ArrowLeft": Emu.Left,
        "ArrowRight": Emu.Right,
        "a": Emu.A,
        "s": Emu.B,
        "z": Emu.X,
        "x": Emu.Y,
        "q": Emu.Start,
        "w": Emu.Select,
    };

    // just create a nonsense memory array for now
    const memory = new Uint8Array(256 * 1024);

    const emu = new Emulator(audioContext, eUI.canvas);
    if (!audioStarted) {
        audioStarted = true;
        await audioContext.resume();
    }
    await emu.waitForReady();
    console.log("Emulator is ready!");
    emu.reset({ memory: memory });

    bind(eUI.chrome, "keydown", (evt) => {
        if (evt.repeat) return;

        const el = keysToButtons[evt.key];
        const b = keysToEmulator[evt.key];
        if (!el || !b) return;

        el.classList.add("is-active");
        emu.buttonDown(b);
    });

    bind(eUI.chrome, "keyup", (evt) => {
        const el = keysToButtons[evt.key];
        const b = keysToEmulator[evt.key];
        if (!el || !b) return;

        el.classList.remove("is-active");
        emu.buttonUp(b);
    });

    document.body.append(eUI.root);
    eUI.chrome.focus();
}


function init(rw: Widget) {
    rootWidget = rw;
    document.body.append(rw.root);
}

async function boot() {
    audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule("/vendor/audio_engine.js");
    console.log("Audio engine module initialised");


    const rp = new AppPane();

    const btn = new Button("Build & Run");
    const tb = new Toolbar();
    tb.add(btn);
    rp.setToolbarWidget(tb);

    const ed = new CodeEditor("testCode");
    rp.setMainWidget(ed);

    init(rp);

    btn.onclick = async () => {
        if (!toolchain.ready) {
            alert("Toolchain not ready!");
            return;
        }

        const res = await toolchain.build(ed.value);

        runEmulator();
    };
}

document.addEventListener("DOMContentLoaded", function(evt) {
    boot();
});
