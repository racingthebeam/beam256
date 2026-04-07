START_OP(OP_MOVA)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD imm = (ins >> 6) & ((1 << 18) - 1);
// END-DECODE

SET_REG(r_dst, imm);

END_OP()
