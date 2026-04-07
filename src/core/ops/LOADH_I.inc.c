START_OP(OP_LOADH_I)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD addr = (ins >> 6) & ((1 << 18) - 1);
// END-DECODE

SET_REG(r_dst, mem_read_uint16_le(m->mem + addr));

END_OP()
