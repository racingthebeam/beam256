START_OP(OP_PUSH_I)
// START-DECODE
// Auto-generated code, do not edit
WORD imm = ((WORD)(ins << (32 - 24 - 0))) >> (32 - 24);
// END-DECODE

PUSH(imm);

END_OP()
