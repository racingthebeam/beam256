START_OP(OP_JMP)
// START-DECODE
// Auto-generated code, do not edit
WORD imm = ((WORD)(ins << (32 - 24 - 0))) >> (32 - 24);
// END-DECODE

JMP_REL(imm);

END_OP()
