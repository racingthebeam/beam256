import { Emulator } from "./emulator.js";
import { createMachine } from "./machine.js";

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
            machine = await createMachine({
                onEvent: (evt, arg) => {
                    console.log("EVENT", evt, arg);
                }
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
