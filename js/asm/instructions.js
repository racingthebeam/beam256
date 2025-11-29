import * as T from "./optypes.js";
import * as O from "./opcodes.js";

// Argument types:
// reg - register reference (7-bit, 0-127)
// s17 - signed 17 bit number 
// addr - 16-bit absolute address
// raddr - indirect address from register (7-bit, 0-127)
// rel - 8-bit instruction relative address (-128 - 127)
// u16 - 16-bit unsigned value
// u8 - 8-bit unsigned value

export const Instructions = {
    //
    // Get/Set

    "MOV": [
        {
            // Params denotes the order as written by humans in assembly code
            // This doesn't always match the order in which they're encoded
            // because the human-written representation favours destination-
            // first, whereas the native representation is chosen so as to
            // minimise the total number of encodings.
            params: [T.Reg, T.Reg],

            // The machine-level opcode
            op: O.OP_MOV,

            // This defines how the instructions are encoded
            // If encoding order matches the argument order, this can be
            // omitted/set to null
            enc: null,
        },
        {
            params: [T.Reg, T.S17],
        }
    ],
    // "MOVH": [
    //     {
    //         args: [O.Reg, O.U16]
    //     },
    // ],
    // "MOVL": [
    //     {
    //         args: [O.Reg, O.U16]
    //     }
    // ],
    // "STORE": [
    //     {
    //         args: [O.Addr, O.Reg]
    //     },
    //     {
    //         args: [O.RegAddr, O.Reg]
    //     }
    // ],
    // "LOAD": [
    //     {
    //         args: [O.Reg, O.Addr],
    //         enc: [1, 0]
    //     },
    //     {
    //         args: [O.Reg, O.RegAddr],
    //     }
    // ],
    "HALT": [
        {
            params: [],
            op: O.OP_HALT
        }
    ]
}
