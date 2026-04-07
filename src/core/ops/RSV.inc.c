START_OP(OP_RSV)
// START-DECODE
// Auto-generated code, do not edit
UWORD imm = (ins >> 0) & ((1 << 24) - 1);
// END-DECODE

RSV(imm);

END_OP()
