START_OP(OP_JMPA)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
// END-DECODE

JMP_ABS(REG(r_dst));

END_OP()
