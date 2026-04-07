START_OP(OP_MAC)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD r_val = (ins >> 6) & ((1 << 6) - 1);
UWORD r_scale = (ins >> 12) & ((1 << 6) - 1);
// END-DECODE

SET_REG(r_dst, REG(r_dst) + REG(r_val) * REG(r_scale));

END_OP()
