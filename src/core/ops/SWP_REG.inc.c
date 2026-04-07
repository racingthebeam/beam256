START_OP(OP_SWP_REG)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r1 = (ins >> 0) & ((1 << 6) - 1);
UWORD r2 = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

WORD tmp = REG(r1);
SET_REG(r1, REG(r2));
SET_REG(r2, tmp);

END_OP()
