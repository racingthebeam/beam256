START_OP(OP_PRINT)
// START-DECODE
// Auto-generated code, do not edit
UWORD idx = (ins >> 12) & ((1 << 12) - 1);
UWORD r1 = (ins >> 0) & ((1 << 6) - 1);
UWORD r2 = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

if (r1 == UNUSED_REG) {
    print(m, idx, 0, 0, 0);
} else if (r2 == UNUSED_REG) {
    print(m, idx, 1, REG(r1), 0);
} else {
    print(m, idx, 2, REG(r1), REG(r2));
}

END_OP()
