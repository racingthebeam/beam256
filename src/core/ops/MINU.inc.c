START_OP(OP_MINU)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD r1 = (ins >> 6) & ((1 << 6) - 1);
UWORD r2 = (ins >> 12) & ((1 << 6) - 1);
// END-DECODE

UWORD v1 = (UWORD)(REG(r1));
UWORD v2 = (UWORD)(REG(r2));
SET_REG(r_dst, (WORD)(MIN(v1, v2)));

END_OP()
