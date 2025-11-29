import * as O from "./opcodes.js";
import { Encoders as E } from "./codec.js";
import { parse } from "./parser.js";
import { typecheck } from "./typecheck.js";
import { codegen } from "./codegen.js";

// assemble() takes the supplied source code, assembles
// it, and returns the resulting 256KiB memory image.
export function assemble(source) {
    const prog = parse(source);
    typecheck(prog);
    return codegen(prog);
}

