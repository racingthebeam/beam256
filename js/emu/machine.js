import BEAM256 from "./beam256.js";

// Register offsets in the register file
export const REG_GRAPHICS_FRAMEBUFFER_ADDR = 1;
export const REG_GRAPHICS_PALETTE_ADDR = 2;
export const REG_GRAPHICS_MODE = 3;
export const REG_GRAPHICS_DRAW = 4;
const REG_COUNT = 4;

export async function createMachine({ onEvent, image }) {
    // Instantiate the machine core's WASM module
    // We use a fresh instance for each machine
    const mod = await BEAM256();

    // Create a function pointer for receiving event callbacks
    // from the machine.
    const onEventFnPtr = mod.addFunction(onEvent, "viii");

    // Initialise the machine, passing in the event callback.
    const ret = mod.ccall('init', 'int', ['int'], [onEventFnPtr]);
    if (ret !== 0) {
        throw new Error(`machine init failed with status ${ret}`);
    }

    // Get the offset of the machine RAM in WASM memory so we can
    // access required data (framebuffer, palette etc)
    const memPtr = mod.ccall('ram_base', 'number');

    const ram = new Uint8Array(mod.HEAPU8.buffer, memPtr, 256 * 1024);
    if (image) {
        ram.set(image);
    }

    return new Machine(mod, ram);
}

class Machine {
    constructor(mod, ram) {
        this.mod = mod;
        this.ram = ram;
        this.view = new DataView(ram.buffer, ram.byteOffset, ram.byteLength);
    }

    get halted() {
        return this.mod.ccall('is_halted', 'bool');
    }

    // tick the machine for the given number of cycles
    tick(ncycles) {
        return this.mod.ccall('tick', 'int', ['int'], [ncycles]);
    }

    setRAM(ram) {
        this.ram.set(ram);
    }

    // read the value of register r
    reg(r) {
        return this.mod.ccall('read_reg', 'uint32', ['int'], [r]);
    }

    // write the value of register r, returning the previous value
    writeReg(r, val) {
        return this.mod.ccall('write_reg', 'uint32', ['int', 'uint32'], [r, val]);
    }

    stop() {

    }
}

