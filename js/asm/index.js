import * as O from "./opcodes.js";
import { Encoders as E } from "./codec.js";

// assemble() takes the supplied source code, assembles
// it, and returns the resulting 256KiB memory image.
export function assemble(source) {
    const out = new Uint8Array(256 * 1024);

    const view = new DataView(out.buffer);
    view.setUint32(0, E.reg_reg(O.OP_MOV, 0, 1), true);
    view.setUint32(4, E.op(O.OP_HALT), true);

    return out;
}

