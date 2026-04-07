START_OP(OP_RET_I)
// START-DECODE
// Auto-generated code, do not edit
WORD imm = ((WORD)(ins << (32 - 24 - 0))) >> (32 - 24);
// END-DECODE

m->sp = f->bp;
f = &(m->frames[--m->fp]);
SET_REG(f->r_dst, imm);

END_OP()
