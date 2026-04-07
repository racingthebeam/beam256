START_OP(OP_STOREXH)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_dst_addr = (ins >> 0) & ((1 << 6) - 1);
UWORD r_off = (ins >> 6) & ((1 << 6) - 1);
UWORD r_src = (ins >> 12) & ((1 << 6) - 1);
// END-DECODE

UWORD addr = REG(r_dst_addr);
UWORD lower = addr & 0x3FFFF;

mem_write_uint16_le(m->mem + lower + REG(r_off), REG(r_src));

if (flags & 0b10) {
    SET_REG(r_dst_addr, (addr & 0xFFFC0000) | (lower + (addr >> 18)));
}

END_OP()
