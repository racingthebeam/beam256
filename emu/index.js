import { Emulator } from "./emulator.js";
import { Machine } from "./machine.js";
import * as ops from "./opcodes.js";

// turn a list of 32 bit opcodes into a uint8array
function makeInstructions(lst) {
    const buf = new ArrayBuffer(lst.length * 4);
    const dv = new DataView(buf);
    let wp = 0;
    for (const ins of lst) {
        dv.setUint32(wp, ins, true);
        wp += 4;
    }
    return new Uint8Array(buf);
}

// Basic program to add 2 numbers and dump machine state
const program = makeInstructions([
    ops.RSV(1), // reserve 1 reg for result
    ops.IPUSH(123), // arg 1
    ops.IPUSH(456), // arg 2
    ops.ICALL(2, 10), // call add (8 is the index in the instruction array)
    ops.IPUSH(3),
    ops.ICALL(2, 13),
    ops.RPOP(0),
    ops.DMP(), // dump machine state
    ops.RDMP(0, 0), // dump result
    ops.HALT(), // and done...

    // adder function
    ops.RSV(3), // need 2 slots for args, 1 for result
    ops.ADD(2, 0, 1),
    ops.RRET(2),

    // multiply function
    ops.RSV(3),
    ops.MUL(2, 0, 1),
    ops.RRET(2),
]);

const machine = new Machine();
machine.memory.set(program, 0);

const emulator = new Emulator({
    machine: machine
});

emulator.start();

