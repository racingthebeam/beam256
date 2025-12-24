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
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_ADD },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_ADD_I }
    ],
    "SUB": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_SUB },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_SUB_I }
    ],
    "MUL": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_MUL },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_MUL_I }
    ],
    "MULS": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_MUL_S },
        { params: [T.Reg, T.Reg, T.S10], op: O.OP_MUL_S_I }
    ],
    "ACC": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_ACC },
        {
            params: [T.Reg, T.Reg, T.U8],
            op: O.OP_ACC_I,
            enc: [2, 0, 1]
        },
    ],
    "DIV": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_DIV },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_DIV_I }
    ],
    "DIVS": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_DIV_S },
        { params: [T.Reg, T.Reg, T.S10], op: O.OP_DIV_S_I }
    ],
    "MOD": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_MOD },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_MOD_I }
    ],
    "MODS": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_MOD_S },
        { params: [T.Reg, T.Reg, T.S10], op: O.OP_MOD_S_I }
    ],
    "ABS": [
        { params: [T.Reg, T.Reg], op: O.OP_ABS }
    ],
    "NEG": [
        { params: [T.Reg, T.Reg], op: O.OP_NEG }
    ],

    "AND": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_AND },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_AND_I }
    ],
    "OR": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_OR },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_OR_I }
    ],
    "XOR": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_XOR },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_XOR_I }
    ],
    "NOT": [
        { params: [T.Reg, T.Reg], op: O.OP_NOT }
    ],
    "SHL": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_SHL },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_SHL_I }
    ],
    "SHR": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_SHR },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_SHR_I }
    ],
    "SAR": [
        { params: [T.Reg, T.Reg, T.Reg], op: O.OP_SAR },
        { params: [T.Reg, T.Reg, T.U10], op: O.OP_SAR_I }
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
    "VJMP": [
        { params: [T.U16, T.Reg], op: O.OP_VJMP, enc: [1, 0] }
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
    "LOADXB": [
        { params: [T.Reg, T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_LOADXB },
        { params: [T.Reg, T.Reg, T.U7], flags: T.FlagsMemX, op: O.OP_LOADXB_I }
    ],
    "LOADXH": [
        { params: [T.Reg, T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_LOADXH },
        { params: [T.Reg, T.Reg, T.U7], flags: T.FlagsMemX, op: O.OP_LOADXH_I }
    ],
    "LOADXW": [
        { params: [T.Reg, T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_LOADXW },
        { params: [T.Reg, T.Reg, T.U7], flags: T.FlagsMemX, op: O.OP_LOADXW_I }
    ],

    "STOREFB": [
        { params: [T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_STOREFB }
    ],
    "STOREFH": [
        { params: [T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_STOREFH }
    ],
    "STOREFW": [
        { params: [T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_STOREFW }
    ],
    "LOADFB": [
        { params: [T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_LOADFB }
    ],
    "LOADFH": [
        { params: [T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_LOADFH }
    ],
    "LOADFW": [
        { params: [T.Reg, T.Reg], flags: T.FlagsMemX, op: O.OP_LOADFW }
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

    "JZ": [{ params: [T.Reg, T.S17], op: O.OP_JZ }],
    "JNZ": [{ params: [T.Reg, T.S17], op: O.OP_JNZ }],
    "JLTZ": [{ params: [T.Reg, T.S17], op: O.OP_JLTZ }],
    "JLEZ": [{ params: [T.Reg, T.S17], op: O.OP_JLEZ }],
    "JGTZ": [{ params: [T.Reg, T.S17], op: O.OP_JGTZ }],
    "JGEZ": [{ params: [T.Reg, T.S17], op: O.OP_JGEZ }],

    "JEQ": [
        { params: [T.Reg, T.Reg, T.S9], op: O.OP_JEQ },
        { params: [T.Reg, T.U8, T.S9], op: O.OP_JEQ_I },
    ],
    "JNE": [
        { params: [T.Reg, T.Reg, T.S9], op: O.OP_JNE },
        { params: [T.Reg, T.U8, T.S9], op: O.OP_JNE_I },
    ],
    "JLT": [
        { params: [T.Reg, T.Reg, T.S9], op: O.OP_JLT },
        { params: [T.Reg, T.U8, T.S9], op: O.OP_JLT_I },
    ],
    "JLE": [
        { params: [T.Reg, T.Reg, T.S9], op: O.OP_JLE },
        { params: [T.Reg, T.U8, T.S9], op: O.OP_JLE_I },
    ],
    "JGT": [
        { params: [T.Reg, T.Reg, T.S9], op: O.OP_JGT },
        { params: [T.Reg, T.U8, T.S9], op: O.OP_JGT_I },
    ],
    "JGE": [
        { params: [T.Reg, T.Reg, T.S9], op: O.OP_JGE },
        { params: [T.Reg, T.U8, T.S9], op: O.OP_JGE_I },
    ],

    "JLTU": [{ params: [T.Reg, T.Reg, T.S9], op: O.OP_JLTU }],
    "JLEU": [{ params: [T.Reg, T.Reg, T.S9], op: O.OP_JLEU }],
    "JGTU": [{ params: [T.Reg, T.Reg, T.S9], op: O.OP_JGTU }],
    "JGEU": [{ params: [T.Reg, T.Reg, T.S9], op: O.OP_JGEU }],

    "DUP": [
        { params: [], op: O.OP_STACK_DUP }
    ],

    "SWP": [
        // not sure how i feel about this, zero operand version
        // manipulates the stack, 2 reg form manipulates registers
        { params: [], op: O.OP_STACK_SWP },
        { params: [T.Reg, T.Reg], op: O.OP_SWP }
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
