START_OP(OP_MOVH)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD imm = (ins >> 6) & ((1 << 16) - 1);
// END-DECODE

UWORD curr = (UWORD)(REG(r_dst));
curr = (curr & 0x0000FFFF) | (imm << 16);
SET_REG(r_dst, (WORD)curr);

END_OP()
