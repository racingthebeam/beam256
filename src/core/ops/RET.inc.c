START_OP(OP_RET)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_ret = (ins >> 0) & ((1 << 6) - 1);
// END-DECODE

WORD ret = REG(r_ret);
m->sp = f->bp;
f = &(m->frames[--m->fp]);
SET_REG(f->r_dst, ret);

END_OP()
