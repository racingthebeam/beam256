START_OP(OP_DIVMODU)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst_div = (ins >> 0) & ((1 << 6) - 1);
UWORD r_dst_mod = (ins >> 6) & ((1 << 6) - 1);
UWORD r1 = (ins >> 12) & ((1 << 6) - 1);
UWORD r2 = (ins >> 18) & ((1 << 6) - 1);
// END-DECODE

UWORD v1 = (UWORD)(REG(r1));
UWORD v2 = (UWORD)(REG(r2));
SET_REG(r_dst_div, (WORD)(v1 / v2));
SET_REG(r_dst_mod, (WORD)(v1 % v2));

END_OP()
