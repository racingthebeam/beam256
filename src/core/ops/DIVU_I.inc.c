START_OP(OP_DIVU_I)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD r1 = (ins >> 6) & ((1 << 6) - 1);
UWORD imm = (ins >> 12) & ((1 << 12) - 1);
// END-DECODE

UWORD v1 = (UWORD)(REG(r1));
SET_REG(r_dst, (WORD)(v1 / imm));

END_OP()
