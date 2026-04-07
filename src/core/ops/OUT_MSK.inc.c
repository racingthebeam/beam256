START_OP(OP_OUT_MSK)
// START-DECODE
// Auto-generated code, do not edit
UWORD port = (ins >> 0) & ((1 << 8) - 1);
UWORD r_src = (ins >> 8) & ((1 << 6) - 1);
UWORD r_mask = (ins >> 14) & ((1 << 6) - 1);
// END-DECODE

m->on_io_write(port, REG(r_src), REG(r_mask));

END_OP()
