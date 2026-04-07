START_OP(OP_IN)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst = (ins >> 8) & ((1 << 6) - 1);
UWORD port = (ins >> 0) & ((1 << 8) - 1);
// END-DECODE

SET_REG(r_dst, m->on_io_read(port));

END_OP()
