START_OP(OP_PUSH)
// START-DECODE
// Auto-generated code, do not edit
UWORD r1 = (ins >> 0) & ((1 << 6) - 1);
UWORD r2 = (ins >> 6) & ((1 << 6) - 1);
UWORD r3 = (ins >> 12) & ((1 << 6) - 1);
UWORD r4 = (ins >> 18) & ((1 << 6) - 1);
// END-DECODE

if (r4 != UNUSED_REGISTER) {
    PUSH(REG(r1));
    PUSH(REG(r2));
    PUSH(REG(r3));
    PUSH(REG(r4));
} else if (r3 != UNUSED_REGISTER) {
    PUSH(REG(r1));
    PUSH(REG(r2));
    PUSH(REG(r3));
} else if (r2 != UNUSED_REGISTER) {
    PUSH(REG(r1));
    PUSH(REG(r2));
} else {
    PUSH(REG(r1));
}

END_OP()
