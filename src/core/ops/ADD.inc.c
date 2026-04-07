START_OP(OP_ADD)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD r1 = (ins >> 6) & ((1 << 6) - 1);
UWORD r2 = (ins >> 12) & ((1 << 6) - 1);
// END-DECODE

SET_REG(r_dst, REG(r1) + REG(r2));

END_OP()
