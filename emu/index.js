import BEAM256 from "./beam256.js";
import { Emulator } from "./emulator.js";

async function createMachine(onEvent) {
    // Instantiate the machine core's WASM module
    // We use a fresh instance for each machine
    const mod = await BEAM256();

    // Create a function pointer for receiving event callbacks
    // from the machine.
    const onEventFnPtr = mod.addFunction(onEvent, "vii");

    // Initialise the machine, passing in the event callback.
    const ret = mod.ccall('init', 'int', ['int'], [onEventFnPtr]);
    if (ret !== 0) {
        throw new Error(`machine init failed with status ${ret}`);
    }

    // Get the offset of the machine RAM in WASM memory so we can
    // access required data (framebuffer, palette etc)
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

    stop() {

    }
}

const editor = CodeMirror(document.querySelector('#editor'), {
    lineNumbers: true,
    autofocus: true,
});

let machine = null;
let emu = null;
let state = "stopped";

const btnStartStop = document.querySelector('button[name="startstop"]');
btnStartStop.onclick = async (evt) => {
    switch (state) {
        case "stopped":
            state = "starting";
            machine = await createMachine((evt, arg) => {
                console.log("EVENT", evt, arg);
            });
            emu = new Emulator({
                machine: machine,
                display: document.querySelector('canvas#display'),
            });
            emu.start();
            state = "running";
            btnStartStop.textContent = "Stop";
            break;
        case "starting":
            // do nothing
            break;
        case "running":
            emu.stop();
            state = "stopped";
            break;
    }
};
