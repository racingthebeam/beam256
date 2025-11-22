import {
    REG_GRAPHICS_FRAMEBUFFER_ADDR,
    REG_GRAPHICS_PALETTE_ADDR,
    REG_GRAPHICS_MODE
} from "./machine.js";

import {
    MemorySize
} from "./constants.js";

// Emulator provides IO and all other external integration
// to a Machine
export class Emulator {
    constructor({ machine, display }) {
        this.machine = machine;
        this.display = display;
        this.ctx = display.getContext('2d');

        // ImageData for raw pixel data.
        // Cache it here to avoid constantly calling getImageData(), which
        // defeats HW acceleration.
        // Re-assigned each time the display is reset.
        this.px = null;
    }

    start() {
        const tick = () => {
            this.machine.runCycles(100);
            setTimeout(tick, 0);
        };

        const draw = () => {
            this.#draw();
            requestAnimationFrame(draw);
        };

        this.#resetDisplay();

        tick();
        requestAnimationFrame(draw);
    }

    #resetDisplay() {
        const mode = this.machine.reg[REG_GRAPHICS_MODE];
        const bigScreen = !!(mode & 0x01);
        const bigPalette = !!(mode & 0x02);
        let logicalWidth = ((mode >> 8) & 0xFF) * 2;
        let logicalHeight = ((mode >> 16) & 0xFF) * 2;
        let stride = ((mode >> 24) & 0xFF) * 2;

        const nativeWidth = bigScreen ? 320 : 160;
        const nativeHeight = 200;

        if (logicalWidth === 0) logicalWidth = nativeWidth;
        if (logicalHeight === 0) logicalHeight = nativeHeight;

        if (logicalWidth > nativeWidth || logicalHeight > nativeHeight) {
            // it's ok to throw here since it's defo a bug - the error should have
            // been caught inside the machine when the register was last updated.
            throw new Error("invalid logical size for display - this is a bug");
        }

        if (stride === 0) {
            stride = logicalWidth / (bigPalette ? 1 : 2);
        }

        this.displayState = {
            nativeWidth,
            nativeHeight,
            logicalWidth,
            logicalHeight,
            stride,
            bpp: bigPalette ? 8 : 4,
            dstX: 0,
            dstY: 0,
        };

        this.display.width = nativeWidth;
        this.display.height = nativeHeight;

        // FIXME: I guess we should extract the central region?
        this.px = this.ctx.getImageData(0, 0, logicalWidth, logicalHeight);
    }

    #draw() {
        const mem = this.machine.memory;
        const px = this.px;

        let lineRp = this.machine.reg[REG_GRAPHICS_FRAMEBUFFER_ADDR];

        const paletteBase = this.machine.reg[REG_GRAPHICS_PALETTE_ADDR];
        const getColor = (dst, ent) => {
            const offset = (paletteBase + (ent * 4)) % MemorySize;
            dst[0] = mem[offset + 0] << 2;
            dst[1] = mem[offset + 1] << 2;
            dst[2] = mem[offset + 2] << 2;
        }

        const color = [0, 0, 0];
        let wp = 0;
        if (this.displayState.bpp === 4) {
            for (let line = 0; line < this.displayState.logicalHeight; line++) {
                let rp = lineRp;
                for (let col = 0; col < this.displayState.logicalWidth; col += 2) {
                    const fbp = mem[rp++];
                    getColor(color, fbp & 0x0F);
                    px.data[wp++] = color[0];
                    px.data[wp++] = color[1];
                    px.data[wp++] = color[2];
                    px.data[wp++] = 255;
                    getColor(color, fbp >> 4);
                    px.data[wp++] = color[0];
                    px.data[wp++] = color[1];
                    px.data[wp++] = color[2];
                    px.data[wp++] = 255;
                }
                lineRp += this.displayState.stride;
            }
        } else {
            for (let line = 0; line < this.displayState.logicalHeight; line++) {
                let rp = lineRp;
                for (let col = 0; col < this.displayState.logicalWidth; col++) {
                    const fbp = mem[rp++];
                    getColor(color, fbp);
                    mem[wp++] = color[0];
                    mem[wp++] = color[1];
                    mem[wp++] = color[2];
                    mem[wp++] = 0;
                }
                lineRp += this.displayState.stride;
            }
        }

        this.ctx.putImageData(px, this.displayState.dstX, this.displayState.dstY);
    }
}
