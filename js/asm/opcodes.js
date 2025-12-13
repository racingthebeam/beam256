export const OP_NOP = 0;
export const OP_MOV = 1;
export const OP_MOV_I = 2;
export const OP_MOVL = 15;
export const OP_MOVH = 16;

export const OP_ADD = 3;
export const OP_SUB = 4;
export const OP_MUL = 5;
export const OP_DIV = 6;
export const OP_MOD = 7;

export const OP_AND = 8;
export const OP_OR = 9;
export const OP_XOR = 10;
export const OP_NOT = 11;
export const OP_SHL = 12;
export const OP_SHR = 13;
export const OP_SAR = 14;

export const OP_UJMP_ADDR = 17;
export const OP_UJMP_REG = 18;

export const OP_IN = 19;
export const OP_OUT_I = 20;
export const OP_OUT_REG = 21;
export const OP_OUT_REG_MASK = 22;

export const OP_LOAD_I = 23;
export const OP_LOAD_REG = 24;
export const OP_STORE_I = 25;
export const OP_STORE_REG = 26;

export const OP_PUSH_I = 27;
export const OP_PUSH_REG = 28;
export const OP_POP = 29;
export const OP_POP_REG = 30;
export const OP_RSV = 31;

export const OP_BCALL = 32;
export const OP_BCALL_DISCARD = 33;
export const OP_CALL_REG = 34;
export const OP_NARGS = 35;
export const OP_RET_I = 36;
export const OP_RET_REG = 37;

export const OP_MOV_O = 38;

export const OP_MUL_S = 39;
export const OP_DIV_S = 40;

export const OP_ABS = 41;
export const OP_NEG = 42;

export const OP_BSET = 43;
export const OP_BCLR = 44;
export const OP_BTOG = 45;
export const OP_BTST = 46;

export const OP_BSET_I = 47;
export const OP_BCLR_I = 48;
export const OP_BTOG_I = 49;
export const OP_BTST_I = 50;

export const OP_STOREXB = 51;
export const OP_STOREXB_I = 52;
export const OP_STOREXH = 53;
export const OP_STOREXH_I = 54;
export const OP_STOREXW = 55;
export const OP_STOREXW_I = 56;

export const OP_DUMP = 126;
export const OP_HALT = 127;

//
// Extended opcodes

export const OP_CALL_I = 0x80000000;
