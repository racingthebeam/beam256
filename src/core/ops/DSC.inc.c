START_OP(OP_DSC)
// START-DECODE
// Auto-generated code, do not edit
UWORD imm = (ins >> 0) & ((1 << 24) - 1);
// END-DECODE

m->sp -= imm;

END_OP()
