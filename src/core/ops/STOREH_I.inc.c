START_OP(OP_STOREH_I)
// START-DECODE
// Auto-generated code, do not edit
UWORD addr = (ins >> 6) & ((1 << 18) - 1);
UWORD r_src = (ins >> 0) & ((1 << 6) - 1);
// END-DECODE

mem_write_uint16_le(m->mem + addr, REG(r_src));

END_OP()
