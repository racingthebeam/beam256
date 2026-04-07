START_OP(OP_STOREB_I)
// START-DECODE
// Auto-generated code, do not edit
UWORD addr = (ins >> 6) & ((1 << 18) - 1);
UWORD r_src = (ins >> 0) & ((1 << 6) - 1);
// END-DECODE

m->mem[addr] = REG(r_src);

END_OP()
