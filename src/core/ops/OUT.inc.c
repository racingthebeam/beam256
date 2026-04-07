START_OP(OP_OUT)
// START-DECODE
// Auto-generated code, do not edit
UWORD port = (ins >> 0) & ((1 << 8) - 1);
UWORD r_src = (ins >> 8) & ((1 << 6) - 1);
// END-DECODE

m->on_io_write(port, REG(r_src), 0xFFFFFFFF);

END_OP()
