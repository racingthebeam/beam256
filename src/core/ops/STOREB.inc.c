START_OP(OP_STOREB)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_dst_addr = (ins >> 0) & ((1 << 6) - 1);
UWORD r_src = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

m->mem[REG(r_dst_addr)] = REG(r_src);

END_OP()
