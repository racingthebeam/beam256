START_OP(OP_JLTZ)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_cmp = (ins >> 0) & ((1 << 6) - 1);
WORD imm = ((WORD)(ins << (32 - 16 - 6))) >> (32 - 16);
// END-DECODE

REL_JMP_PRE_DEC(flags, r_cmp);

if (REG(r_cmp) < 0) {
    JMP_REL(imm);
}

REL_JMP_POST_INC(flags, r_cmp);

END_OP()
