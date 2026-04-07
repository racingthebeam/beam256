START_OP(OP_JLTU)
// START-DECODE
// Auto-generated code, do not edit
UWORD r1 = (ins >> 0) & ((1 << 6) - 1);
UWORD r2 = (ins >> 6) & ((1 << 6) - 1);
WORD imm_jmp = ((WORD)(ins << (32 - 12 - 12))) >> (32 - 12);
// END-DECODE

UWORD v1 = (UWORD)(REG(r1));
UWORD v2 = (UWORD)(REG(r2));

if (v1 < v2) {
    JMP_REL(imm_jmp);
}

END_OP()
