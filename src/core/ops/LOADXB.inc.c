START_OP(OP_LOADXB)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD r_src_addr = (ins >> 6) & ((1 << 6) - 1);
UWORD r_off = (ins >> 12) & ((1 << 6) - 1);
// END-DECODE

UWORD addr = REG(r_src_addr);
UWORD lower = addr & 0x3FFFF;

WORD val = m->mem[lower + REG(r_off)];

if (flags & 0b01) {
    SET_REG(r_dst, (val << 24) >> 24);
} else {
    SET_REG(r_dst, val);
}

if (flags & 0b10) {
    SET_REG(r_src_addr, (addr & 0xFFFC0000) | (lower + (addr >> 18)));
}

END_OP()
