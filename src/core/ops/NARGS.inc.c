START_OP(OP_NARGS)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
// END-DECODE

SET_REG(r_dst, f->nargs);

END_OP()
