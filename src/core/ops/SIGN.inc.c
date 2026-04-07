START_OP(OP_SIGN)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD r1 = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

WORD val = REG(r1);
SET_REG(r_dst, (val == 0) ? 0 : (val > 0 ? 1 : -1));

END_OP()
