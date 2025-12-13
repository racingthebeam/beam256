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
        { params: [T.Reg, T.S17], op: O.OP_MOV_I },
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_MOV_O }
    ],
    "MOVL": [
        { params: [T.Reg, T.U16], op: O.OP_MOVL },
    ],
    "MOVH": [
        { params: [T.Reg, T.U16], op: O.OP_MOVH },
    ],

    "ADD": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_ADD }
    ],
    "SUB": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_SUB }
    ],
    "MUL": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_MUL }
    ],
    "MULS": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_MUL_S }
    ],
    "DIV": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_DIV }
    ],
    "DIVS": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_DIV_S }
    ],
    "MOD": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_MOD }
    ],
    "ABS": [
        { params: [T.Reg, T.Reg], op: O.OP_ABS }
    ],
    "NEG": [
        { params: [T.Reg, T.Reg], op: O.OP_NEG }
    ],

    "AND": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_AND }
    ],
    "OR": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_OR }
    ],
    "XOR": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_XOR }
    ],
    "NOT": [
        { params: [T.Reg, T.Reg], op: O.OP_NOT }
    ],
    "SHL": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_SHL }
    ],
    "SHR": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_SHR }
    ],
    "SAR": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_SAR }
    ],
    "BSET": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_BSET },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_BSET_I }
    ],
    "BCLR": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_BCLR },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_BCLR_I }
    ],
    "BTOG": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_BTOG },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_BTOG_I }
    ],
    "BTST": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_BTST },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_BTST_I }
    ],

    "JMP": [
        { params: [T.U16], op: O.OP_UJMP_ADDR },
        { params: [T.Reg], op: O.OP_UJMP_REG }
    ],

    "IN": [
        {
            params: [T.Reg, T.U8], op: O.OP_IN,
            enc: [1, 0]
        }
    ],
    "OUT": [
        { params: [T.U8, T.U16], op: O.OP_OUT_I },
        { params: [T.U8, T.Reg], op: O.OP_OUT_REG },
        { params: [T.U8, T.Reg, T.Reg], op: O.OP_OUT_REG_MASK },
    ],

    "LOAD": [
        { params: [T.Reg, T.U16], op: O.OP_LOAD_I },
        { params: [T.Reg, T.Reg], op: O.OP_LOAD_REG },
    ],
    "STORE": [
        { params: [T.U16, T.Reg], op: O.OP_STORE_I, enc: [1, 0] },
        { params: [T.Reg, T.Reg], op: O.OP_STORE_REG },
    ],
    "STOREXB": [
        { params: [T.Reg, T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_STOREXB },
        { params: [T.Reg, T.U7, T.Reg], flags: T.FlagsMemX, op: O.OP_STOREXB_I }
    ],
    "STOREXH": [
        { params: [T.Reg, T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_STOREXH },
        { params: [T.Reg, T.U7, T.Reg], flags: T.FlagsMemX, op: O.OP_STOREXH_I }
    ],
    "STOREXW": [
        { params: [T.Reg, T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_STOREXW },
        { params: [T.Reg, T.U7, T.Reg], flags: T.FlagsMemX, op: O.OP_STOREXW_I }
    ],

    "PUSH": [
        { params: [T.S17], op: O.OP_PUSH_I },
        { params: [T.Reg], op: O.OP_PUSH_REG }
    ],
    "POP": [
        { params: [], op: O.OP_POP },
        { params: [T.Reg], op: O.OP_POP_REG },
    ],
    "RSV": [
        { params: [T.U7], op: O.OP_RSV }
    ],

    "BCALL": [
        { params: [T.Reg, T.U5, T.U12], op: O.OP_BCALL },
        { params: [T.U5, T.U12], op: O.OP_BCALL_DISCARD },
    ],
    "CALL": [
        { params: [T.Reg, T.Reg, T.U7], op: O.OP_CALL_REG },
        { params: [T.Reg, T.U14, T.U7], op: O.OP_CALL_I }
    ],
    "NARGS": [
        { params: [T.Reg], op: O.OP_NARGS }
    ],
    "RET": [
        { params: [T.S17], op: O.OP_RET_I },
        { params: [T.Reg], op: O.OP_RET_REG }
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
    "DUMP": [
        { params: [], op: O.OP_DUMP }
    ],
    "HALT": [
        {
            params: [],
            op: O.OP_HALT
        }
    ]
}
