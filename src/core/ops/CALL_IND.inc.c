START_OP(OP_CALL_IND)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_ret = (ins >> 0) & ((1 << 6) - 1);
UWORD imm_ind = (ins >> 12) & ((1 << 12) - 1);
UWORD n_args = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

END_OP()
