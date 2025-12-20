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

export const OP_LOADXB = 57;
export const OP_LOADXB_I = 58;
export const OP_LOADXH = 59;
export const OP_LOADXH_I = 60;
export const OP_LOADXW = 61;
export const OP_LOADXW_I = 62;

export const OP_STOREFB = 63;
export const OP_STOREFH = 64;
export const OP_STOREFW = 65;
export const OP_LOADFB = 66;
export const OP_LOADFH = 67;
export const OP_LOADFW = 68;

export const OP_MOD_S = 69;

export const OP_ADD_I = 70;
export const OP_SUB_I = 71;
export const OP_MUL_I = 72;
export const OP_MUL_S_I = 73;
export const OP_DIV_I = 74;
export const OP_DIV_S_I = 75;
export const OP_MOD_I = 76;
export const OP_MOD_S_I = 77;
export const OP_AND_I = 78;
export const OP_OR_I = 79;
export const OP_XOR_I = 80;
export const OP_SHL_I = 81;
export const OP_SHR_I = 82;
export const OP_SAR_I = 83;

export const OP_JZ = 84;
export const OP_JNZ = 85;
export const OP_JLTZ = 86;
export const OP_JLEZ = 87;
export const OP_JGTZ = 88;
export const OP_JGEZ = 89;

export const OP_JEQ = 90;
export const OP_JNE = 91;
export const OP_JLT = 92;
export const OP_JLE = 93;
export const OP_JGT = 94;
export const OP_JGE = 95;

export const OP_JEQ_I = 96;
export const OP_JNE_I = 97;
export const OP_JLT_I = 98;
export const OP_JLE_I = 99;
export const OP_JGT_I = 100;
export const OP_JGE_I = 101;

export const OP_JLTU = 102;
export const OP_JLEU = 103;
export const OP_JGTU = 104;
export const OP_JGEU = 105;

export const OP_DUMP = 126;
export const OP_HALT = 127;

//
// Extended opcodes

export const OP_CALL_I = 0x80000000;
