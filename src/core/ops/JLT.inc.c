START_OP(OP_JLT)
// START-DECODE
// Auto-generated code, do not edit
UWORD r1 = (ins >> 0) & ((1 << 6) - 1);
UWORD r2 = (ins >> 6) & ((1 << 6) - 1);
WORD imm = ((WORD)(ins << (32 - 12 - 12))) >> (32 - 12);
// END-DECODE

if (REG(r1) < REG(r2)) {
    JMP_REL(imm);
}

END_OP()
