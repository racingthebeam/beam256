import BEAM256 from "./beam256.js";
import { Emulator } from "./emulator.js";

async function createMachine() {
    const mod = await BEAM256();

    const onEvent = mod.addFunction((evt, arg) => {
        console.log("received event", evt, arg);
    }, "vii");

    const ret = mod.ccall('init', 'int', ['int'], [onEvent]);
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
            machine = await createMachine();
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
