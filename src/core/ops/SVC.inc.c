START_OP(OP_SVC)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD idx = (ins >> 12) & ((1 << 12) - 1);
UWORD n_args = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

END_OP()
