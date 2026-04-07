START_OP(OP_MOV_I)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
WORD imm = ((WORD)(ins << (32 - 18 - 6))) >> (32 - 18);
// END-DECODE

REG(r_dst) = imm;

END_OP()
