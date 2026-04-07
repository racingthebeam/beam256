START_OP(OP_JMPA_I)
// START-DECODE
// Auto-generated code, do not edit
UWORD imm = (ins >> 0) & ((1 << 24) - 1);
// END-DECODE

JMP_ABS(imm);

END_OP()
