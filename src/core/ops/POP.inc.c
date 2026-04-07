START_OP(OP_POP)
// START-DECODE
// Auto-generated code, do not edit
UWORD r4 = (ins >> 0) & ((1 << 6) - 1);
UWORD r3 = (ins >> 6) & ((1 << 6) - 1);
UWORD r2 = (ins >> 12) & ((1 << 6) - 1);
UWORD r1 = (ins >> 18) & ((1 << 6) - 1);
// END-DECODE

if (r1 != UNUSED_REGISTER) {
    SET_REG(r1, POP());
    SET_REG(r2, POP());
    SET_REG(r3, POP());
    SET_REG(r4, POP());
} else if (r2 != UNUSED_REGISTER) {
    SET_REG(r2, POP());
    SET_REG(r3, POP());
    SET_REG(r4, POP());
} else if (r3 != UNUSED_REGISTER) {
    SET_REG(r3, POP());
    SET_REG(r4, POP());
} else {
    SET_REG(r4, POP());
}

END_OP()
