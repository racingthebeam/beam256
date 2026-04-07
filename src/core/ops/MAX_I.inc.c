START_OP(OP_MAX_I)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD r1 = (ins >> 6) & ((1 << 6) - 1);
WORD imm = ((WORD)(ins << (32 - 12 - 12))) >> (32 - 12);
// END-DECODE

SET_REG(r_dst, MAX(REG(r1), imm));

END_OP()
