import { MemorySize, LittleEndian, StackSize, FrameStackSize } from "./constants.js";
import * as O from "./opcodes.js";

// const FlagZero = 0x01;
// const FlagCarry = 0x02;

class Frame {
    // ip - address of next instruction to be executed
    //      (absolute offset into main memory)
    // bp - frame's base stack pointer, from which all
    //      register references are relative.
    //      bp is an entry index (each entry is 1 word/4 bytes)
    // nargs - number of arguments that were supplied to this
    //         frame.
    constructor(ip, bp, nargs) {
        this.ip = ip;
        this.bp = bp;
        this.nargs = nargs;
    }
}

export class Machine {
    constructor() {
        // system memory
        this.memory = new Uint8Array(MemorySize);

        // we use a view into the memory for accessing
        // instructions, which will always be 4-byte
        // aligned. this makes it easy to deal with
        // instructions atomically.
        this.amem = new DataView(this.memory.buffer);

        // stack - lives outside memory; only stores words
        this.stack = new Int32Array(StackSize);
        this.sp = 0;

        // callstack
        this.frames = new Array(FrameStackSize);

        // 
        this.frames[0] = new Frame(0, 0, 0);
        this.activeFrame = 0;

        // we'll worry about flags later
        // this.flags = 0;

        this.halted = false;
    }

    runCycles(n) {
        while (!this.halted && n--) {
            this.#tick();
        }
    }

    #tick() {
        const f = this.#activeFrame();

        const op = this.amem.getUint32(f.ip, LittleEndian);
        f.ip += 4;

        switch (O.opcode(op)) {
            case O.OpNop:
                break;
            case O.OpISetL:
                {
                    const [rd, val] = decode_reg_u16(op);
                    this.#setl(rd, val);
                    break;
                }
            case O.OpAdd:
                {
                    const [rd, r1, r2] = decode_reg3(op);
                    this.#set(rd, this.#add(this.#get(r1), this.#get(r2)));
                    break;
                }
            case O.OpMul:
                {
                    const [rd, r1, r2] = decode_reg3(op);
                    this.#set(rd, this.#mul(this.#get(r1), this.#get(r2)));
                    break;
                }

            //
            // Stack

            case O.OpIPush:
                {
                    const [v] = decode_u16(op);
                    this.#push(v);
                    break;
                }
            case O.OpRPush:
                {
                    const [r] = decode_reg(op);
                    this.#push(this.#get(r));
                    break;
                }
            case O.OpPop:
                {
                    this.#pop();
                    break;
                }
            case O.OpRPop:
                {
                    const [r] = decode_reg(op);
                    this.#set(r, this.#pop());
                    break;
                }

            //
            // Function Calling

            case O.OpReserve:
                {
                    const [n] = decode_reg(op);
                    const f = this.frames[this.activeFrame];
                    if (n < f.nargs) {
                        throw new Error("can't reserve fewer stack slots than arguments");
                    }
                    this.sp = f.bp + n;
                    break;
                }
            case O.OpICall:
                {
                    const [nArgs, fn] = decode_reg_u16(op);
                    const newFrame = new Frame(fn << 2, this.sp - nArgs, nArgs);
                    this.frames[++this.activeFrame] = newFrame;
                    break;
                }
            case O.OpRet:
                {
                    const prev = this.frames[this.activeFrame--];
                    this.sp = prev.bp;
                    this.#push(0);
                    break;
                }
            case O.OpRRet:
                {
                    const [r] = decode_reg(op);
                    const ret = this.#get(r);
                    const prev = this.frames[this.activeFrame--];
                    this.sp = prev.bp;
                    this.#push(ret);
                    break;
                }

            //
            // Special

            case O.OpHalt:
                {
                    this.halted = true;
                    break;
                }
            case O.OpDumpState:
                {
                    const f = this.frames[this.activeFrame];
                    console.log("== CPU ==");
                    console.log(`sp=${this.sp}`);
                    console.log("== Active Frame ==");
                    console.log(`bp=${f.bp}, ip=${f.ip}, nargs=${f.nargs}`);
                    break;
                }
            case O.OpDumpRegs:
                {
                    const [rmin, rmax] = decode_reg2(op);
                    for (let r = rmin; r <= rmax; r++) {
                        console.log(`r${r} = ${this.#get(r)}`);
                    }
                    break;
                }

            default:
                throw new Error(`unknown opcode: 0x${O.opcode(op).toString(16)}`);
        }
    }

    #add(l, r) {
        // TODO: this needs to work like a 32 bit arch
        // I'm inclined to say fuck it and rewrite this
        // all in WASM once the prototype is done.
        return l + r;
    }

    #mul(l, r) {
        // TODO: this needs to work like a 32 bit arch
        // I'm inclined to say fuck it and rewrite this
        // all in WASM once the prototype is done.
        return l * r;
    }

    #setl(reg, v) {
        const curr = this.#get(reg);
        this.#set(reg, (curr & 0xFFFF0000) | (v & 0xFFFF));
    }

    #seth(reg, v) {
        const curr = this.#get(reg);
        v = (v & 0xFFFF) << 16;
        this.#set(reg, (curr & 0x0000FFFF) | v);
    }

    // set the value of register rd to val
    #set(rd, val) {
        const f = this.frames[this.activeFrame];
        this.stack[f.bp + rd] = val;
    }

    // read the value of reg r
    #get(r) {
        const f = this.frames[this.activeFrame];
        return this.stack[f.bp + r];
    }

    #push(val) {
        this.stack[this.sp++] = val;
    }

    #pop() {
        return this.stack[--this.sp];
    }

    #activeFrame() {
        return this.frames[this.activeFrame];
    }
}

function decode_u16(op) {
    const v = (op >> 8) & 0xFFFF;
    return [v];
}

function decode_reg_u16(op) {
    const r = (op >> 16) & 0xFF;
    const v = op & 0xFFFF;
    return [r, v];
}

function decode_reg(op) {
    const r = (op >> 16) & 0xFF;
    return [r];
}

function decode_reg2(op) {
    const r1 = (op >> 16) & 0xFF;
    const r2 = (op >> 8) & 0xFF;
    return [r1, r2];
}

function decode_reg3(op) {
    const r1 = (op >> 16) & 0xFF;
    const r2 = (op >> 8) & 0xFF;
    const r3 = (op >> 0) & 0xFF;
    return [r1, r2, r3];
}
