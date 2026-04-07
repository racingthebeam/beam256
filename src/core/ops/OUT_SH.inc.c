START_OP(OP_OUT_SH)
// START-DECODE
// Auto-generated code, do not edit
UWORD port = (ins >> 0) & ((1 << 8) - 1);
UWORD r_src = (ins >> 8) & ((1 << 6) - 1);
UWORD imm_shift = (ins >> 14) & ((1 << 5) - 1);
UWORD imm_width = (ins >> 19) & ((1 << 5) - 1);
// END-DECODE

m->on_io_write(port, REG(r_src) << imm_shift, ((1 << imm_width) - 1) << imm_shift);

END_OP()
