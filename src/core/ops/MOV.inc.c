START_OP(OP_MOV)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD r_src = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

SET_REG(r_dst, REG(r_src));

END_OP()
