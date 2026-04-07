START_OP(OP_JEQ_I)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_cmp = (ins >> 0) & ((1 << 6) - 1);
WORD imm_cmp = ((WORD)(ins << (32 - 9 - 6))) >> (32 - 9);
WORD imm_jmp = ((WORD)(ins << (32 - 9 - 15))) >> (32 - 9);
// END-DECODE

if (REG(r_cmp) == imm_cmp) {
    JMP_REL(imm_jmp);
}

END_OP()
