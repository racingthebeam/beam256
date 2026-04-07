START_OP(OP_OUT_I)
// START-DECODE
// Auto-generated code, do not edit
UWORD port = (ins >> 0) & ((1 << 8) - 1);
UWORD imm = (ins >> 8) & ((1 << 16) - 1);
// END-DECODE

m->on_io_write(port, imm, 0xFFFFFFFF);

END_OP()
