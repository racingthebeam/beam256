START_OP(OP_STOREW)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_dst_addr = (ins >> 0) & ((1 << 6) - 1);
UWORD r_src = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

mem_write_uint32_le(m->mem + REG(r_dst_addr), REG(r_src));

END_OP()
