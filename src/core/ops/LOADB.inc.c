START_OP(OP_LOADB)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD r_src_addr = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

WORD addr = REG(r_src_addr);

int32_t val = m->mem[addr];

if (flags & 0b01) {
    SET_REG(r_dst, (val << 24) >> 24);
} else {
    SET_REG(r_dst, val);
}

if (flags & 0b10) {
    SET_REG(r_src_addr, addr + 1);
}

END_OP()
