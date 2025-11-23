import BEAM256 from "./beam256.js";
import { Emulator } from "./emulator.js";

async function createMachine() {
    const mod = await BEAM256();
    window.mod = mod;

    const ret = mod.ccall('init', 'int');
    if (ret !== 0) {
        throw new Error(`machine init failed with status ${ret}`);
    }

    const memPtr = mod.ccall('ram_base', 'number');
    const ram = new Uint8Array(mod.HEAPU8.buffer, memPtr, 256 * 1024);

    return new Machine(mod, ram);
}

class Machine {
    constructor(mod, ram) {
        this.mod = mod;
        this.ram = ram;
    }

    // tick the machine for the given number of cycles
    tick(ncycles) {
        return this.mod.ccall('tick', 'int', ['int'], [ncycles]);
    }

    // read the value of register r
    reg(r) {
        return this.mod.ccall('read_reg', 'uint32', ['int'], [r]);
    }
}

async function run() {
    const machine = await createMachine();

    const emu = new Emulator({
        machine: machine,
        display: document.querySelector('canvas#display')
    });

    emu.start();
}

run();
