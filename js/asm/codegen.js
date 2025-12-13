import { Encoders as E } from "./codec.js";
import { MemorySize } from "../emu/constants.js"
import * as O from "./opcodes.js";
import { roundUpToNextMultipleOf } from "./helpers.js";

export function codegen(prog) {
    const gen = new CodeGen(prog);
    gen.generate();
    return gen.memory;
}

const extendedOps = {
    [O.OP_CALL_I]: true,
};

// TODO: assembler should keep track of regions that
// have already be written to, and disallow overwrites.

export class CodeGen {
    constructor(prog) {
        this.prog = prog;
        this.memory = new Uint8Array(MemorySize);
        this.view = new DataView(this.memory.buffer);

        this.wp = 0;
    }

    generate() {
        for (const line of this.prog.lines) {
            switch (line.type) {
                case "dir-org":
                    this.wp = line.addr;
                    break;
                case "dir-align":
                    this.wp = roundUpToNextMultipleOf(this.wp, line.align);
                    break;
                case "dir-zero":
                    for (let i = 0; i < line.count; i++) {
                        this.view.setUint8(this.wp, 0);
                        this.wp++;
                    }
                    break;
                case "dir-bytes":
                    for (const b of line.values) {
                        this.view.setUint8(this.wp, b.val);
                        this.wp++;
                    }
                    break;
                case "dir-words":
                    for (const w of line.values) {
                        this.view.setUint32(this.wp, w.val, true);
                        this.wp += 4;
                    }
                    break;
                case "ins":
                    this.emitInstruction(line);
                    break;
                default:
                    throw new Error(`unhandled line type: ${line.type}`)
            }
        }
    }

    emitInstruction(line) {
        const ins = this.generateInstruction(line);
        this.view.setUint32(this.wp, ins, true);
        this.wp += 4;
    }

    generateInstruction(line) {
        const form = line.instruction;

        // If the instruction doesn't define a specific encoding
        // order, use the natural order of its parameters.
        let enc = form.enc;
        if (!enc) {
            enc = [...Array(form.params.length).keys()];
        }

        // const swizzledParams = enc.map(i => form.params[i]);

        // We need to reorder the arguments to conform with what
        // is expected by the instruction encoding.
        const swizzledArgs = enc.map(i => line.args[i]);
        let encoding = enc.map(i => form.params[i].name).join('_') || 'op';

        if (!form.flags && line.flags.size > 0) {
            throw new Error(`form does not accept any flags`);
        } else if (form.flags) {
            const checkResult = form.flags.check(line);
            if (typeof checkResult === 'string') {
                throw new Error(checkResult);
            }
            encoding = `f${form.flags.length}_${encoding}`;
            swizzledArgs.unshift(form.flags.encode(line.flags));
        }

        if (extendedOps[form.op]) {
            encoding = `ext_${encoding}`;
        }

        const codec = E[encoding];
        if (!codec) {
            throw new Error(`couldn't find encoder for '${encoding}'`);
        }

        if (typeof form.op !== 'number') {
            throw new Error("form opcode is not a number, this is a bug!");
        }

        return codec(form.op, ...swizzledArgs);
    }
}

