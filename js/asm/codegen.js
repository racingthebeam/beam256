import { Encoders as E } from "./codec.js";
import { MemorySize } from "../emu/constants.js"

export function codegen(prog) {
    const gen = new CodeGen(prog);
    gen.generate();
    return gen.memory;
}

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

        const codec = E[encoding];
        if (!codec) {
            throw new Error(`couldn't find encoder for '${encoding}'`);
        }

        return codec(form.op, ...swizzledArgs);
    }
}

