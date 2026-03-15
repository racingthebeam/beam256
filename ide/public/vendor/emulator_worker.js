let canvas = null, memory = null, display = null, io = null, audio = null;

const physicalMemory = new WebAssembly.Memory({
    initial: 10,
    maximum: 100,
    shared: true,
});

const ramOffset = 1024;

const DISPLAY_PHYSICAL_WIDTH = 320;
const DISPLAY_PHYSICAL_HEIGHT = 200;

const DISP_STATUS_OFFSET = 0;
const DISP_MODE_OFFSET = 1;
const DISP_FRAMEBUFFER_ADDR_OFFSET = 2;
const DISP_PALETTE_ADDR_OFFSET = 3;
const DISP_DRAW_OFFSET = 4;

const DISP_STATUS_DRAW_BUSY = 0x01;

const DISP_MODE_RES_LOW = (0 << 0);
const DISP_MODE_RES_HIGH = (1 << 0);
const DISP_MODE_RES_MASK = 0b1;

const DISP_MODE_DEPTH_2BPP = (0 << 1);
const DISP_MODE_DEPTH_4BPP = (1 << 1);
const DISP_MODE_DEPTH_8BPP = (2 << 1);
const DISP_MODE_DEPTH_MASK = 0b110;

const IO_BUTTON_UP_MASK = 1;
const IO_BUTTON_DOWN_MASK = 2;
const IO_BUTTON_LEFT_MASK = 4;
const IO_BUTTON_RIGHT_MASK = 8;
const IO_BUTTON_A_MASK = 16;
const IO_BUTTON_B_MASK = 32;
const IO_BUTTON_X_MASK = 64;
const IO_BUTTON_Y_MASK = 128;
const IO_BUTTON_START_MASK = 256;
const IO_BUTTON_SELECT_MASK = 512;

class Display {
    #memory;
    #canvas;
    #ctx;

    constructor(memory, canvas) {
        this.#memory = memory;
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');

        this.reset();
    }

    reset() {
        this.status = 0;
        this.mode = DISP_MODE_RES_HIGH | DISP_MODE_DEPTH_4BPP;
        this.framebuffer = 64 * 1024;
        this.palette = 96 * 1024;
    }

    read(port) {
        switch (port) {
            case DISP_STATUS_OFFSET:
                return this.status;
            case DISP_MODE_OFFSET:
                return this.mode;
            case DISP_FRAMEBUFFER_ADDR_OFFSET:
                return this.framebuffer;
            case DISP_PALETTE_ADDR_OFFSET:
                return this.palette;
            default:
                return 0;
        }
    }

    write(port, value) {
        switch (port) {
            case DISP_MODE_OFFSET:
                this.#trySetMode();
                break;
            case DISP_FRAMEBUFFER_ADDR_OFFSET:
                this.framebuffer = value;
                break;
            case DISP_PALETTE_ADDR_OFFSET:
                this.palette = value;
                break;
            case DISP_DRAW_OFFSET:
                this.#tryTriggerDraw();
                break;
            default:
                console.error(`attempt to write to invalid display port offset {$port}`);
        }
    }

    getPaletteView() {
        const bitDepth = this.mode & DISP_MODE_DEPTH_MASK;
        const count = (bitDepth === DISP_MODE_DEPTH_8BPP) ? 256 : (bitDepth === DISP_MODE_DEPTH_4BPP ? 16 : 4);
        return new DataView(this.#memory.buffer, this.palette, count * 2);
    }

    debugSetColor(ix, rgb565) {
        const pv = this.getPaletteView();
        pv.setUint16(ix * 2, rgb565, true);
    }

    #trySetMode(newMode) {
        if (!this.#isModeValid(newMode)) {
            console.error(`attempted to set invalid display mode ${newMode}`);
            return;
        }
        this.mode = newMode;
    }

    #isModeValid(newMode) {
        return true;
    }

    #tryTriggerDraw() {
        if (this.status & DISP_STATUS_DRAW_BUSY) {
            return;
        }

        this.status |= DISP_STATUS_DRAW_BUSY;

        requestAnimationFrame(() => {
            this.#draw();
            this.status &= ~(DISP_STATUS_DRAW_BUSY);
        })
    }

    #draw() {
        const ctx = this.#ctx;
        const pixels = ctx.getImageData(0, 0, DISPLAY_PHYSICAL_WIDTH, DISPLAY_PHYSICAL_HEIGHT);

        const bitDepth = this.mode & DISP_MODE_DEPTH_MASK;
        const res = this.mode & DISP_MODE_RES_MASK;
        const mem = this.#memory;

        let rp = this.framebuffer;
        let wp = 0;

        const palette = this.getPaletteView();

        const write = (p) => {
            const ent = palette.getUint16(p, true);
            // TODO: work out proper algorithm for expanding RGB565 to RGB888
            const r = (ent & 0b11111) << 3;
            const g = ((ent >> 5) & 0b111111) << 2;
            const b = ((ent >> 11) & 0b11111) << 3;
            pixels.data[wp++] = r;
            pixels.data[wp++] = g;
            pixels.data[wp++] = b;
            pixels.data[wp++] = 255;
        }

        if (bitDepth === DISP_MODE_DEPTH_2BPP) {
            if (res === DISP_MODE_RES_LOW) {
                for (let i = 0; i < 160 * 200; i += 4) {
                    const b = mem[rp];
                    const p1 = (b >> 0) & 0x03;
                    const p2 = (b >> 2) & 0x03;
                    const p3 = (b >> 4) & 0x03;
                    const p4 = (b >> 6) & 0x03;
                    write(p1); write(p1);
                    write(p2); write(p2);
                    write(p3); write(p3);
                    write(p4); write(p4);
                    rp++;
                }
            } else {
                for (let i = 0; i < 320 * 200; i += 4) {
                    const b = mem[rp];
                    const p1 = (b >> 0) & 0x03;
                    const p2 = (b >> 2) & 0x03;
                    const p3 = (b >> 4) & 0x03;
                    const p4 = (b >> 6) & 0x03;
                    write(p1);
                    write(p2);
                    write(p3);
                    write(p4);
                    rp++;
                }
            }
        } else if (bitDepth === DISP_MODE_DEPTH_4BPP) {
            if (res === DISP_MODE_RES_LOW) {
                for (let i = 0; i < 160 * 200; i += 2) {
                    const b = mem[rp];
                    const p1 = (b >> 0) & 0x0F;
                    const p2 = (b >> 4) & 0x0F;
                    write(p1); write(p1);
                    write(p2); write(p2);
                    rp++;
                }
            } else {
                for (let i = 0; i < 320 * 200; i += 2) {
                    const b = mem[rp];
                    const p1 = (b >> 0) & 0x0F;
                    const p2 = (b >> 4) & 0x0F;
                    write(p1);
                    write(p2);
                    rp++;
                }
            }
        } else if (bitDepth === DISP_MODE_DEPTH_8BPP) {
            if (res === DISP_MODE_RES_LOW) {
                for (let i = 0; i < 160 * 200; i++) {
                    const b = mem[rp];
                    write(b); write(b);
                    rp++;
                }
            } else {
                for (let i = 0; i < 320 * 200; i++) {
                    write(mem[rp++]);
                }
            }
        }

        ctx.putImageData(pixels, 0, 0);
    }
}

class IO {
    constructor() {
        this.reset();
    }

    reset() { }

    read(port) { }
    write(port, value) { }

    handleButtonDown(btn) { }
    handleButtonUp(btn) { }
}

class AudioHW {
    constructor(messagePort) {
        this.messagePort = messagePort;
    }

    reset() { }
    read(ioPort) { }
    write(ioPort, value) { }

    debugPlaySound() {
        this.messagePort.postMessage("play");
    }
}

function initAudio(controlPort) {
    controlPort.postMessage({
        type: "ready",
        memoryBuffer: physicalMemory.buffer,
        ramOffset: ramOffset,
    });

    audio = new AudioHW(controlPort);
}

onmessage = (e) => {
    switch (e.data.type) {
        case "init":
            memory = new Uint8Array(256 * 1024);
            canvas = e.data.canvas;
            display = new Display(memory, canvas);
            io = new IO();

            initAudio(e.data.audioPort);

            display.debugSetColor(0, 0x001F);
            display.write(DISP_DRAW_OFFSET, 1);

            postMessage({
                type: "ready",
                memoryBuffer: physicalMemory.buffer,
                ramOffset: 1024,
            });

            break;
        case "reset":
            console.log("RESET");

            const ary = new Int8Array(physicalMemory.buffer, ramOffset, 256 * 1024);
            for (let i = 0; i < ary.length; i++) {
                ary[i] = Math.round(Math.sin((i / 12000) * 440 * 2 * Math.PI) * 127);
            }
            console.log(ary);

            audio.debugPlaySound();
            // memory.set(e.data.memory);
            // TODO: reset the emulation
            break;
        case "buttonDown":
            io.handleButtonDown(e.data.button);
            break;
        case "buttonUp":
            io.handleButtonUp(e.data.button);
            break;
    }
};

