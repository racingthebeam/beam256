START_OP(OP_DIVMOD)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst_div = (ins >> 0) & ((1 << 6) - 1);
UWORD r_dst_mod = (ins >> 6) & ((1 << 6) - 1);
UWORD r1 = (ins >> 12) & ((1 << 6) - 1);
UWORD r2 = (ins >> 18) & ((1 << 6) - 1);
// END-DECODE

SET_REG(r_dst_div, REG(r1) / REG(r2));
SET_REG(r_dst_mod, REG(r1) % REG(r2));

END_OP()
