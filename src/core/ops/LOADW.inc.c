START_OP(OP_LOADW)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD r_src_addr = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

WORD addr = REG(r_src_addr);

int32_t val = mem_read_uint32_le(m->mem + addr);

SET_REG(r_dst, val);

if (flags & 0b10) {
    SET_REG(r_src_addr, addr + 4);
}

END_OP()
