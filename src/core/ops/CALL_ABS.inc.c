START_OP(OP_CALL_ABS)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_ret = (ins >> 0) & ((1 << 6) - 1);
UWORD imm_abs = (ins >> 12) & ((1 << 12) - 1);
UWORD n_args = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

f->r_dst = r_ret;
m->fp++;
m->frames[m->fp].ip = (imm_abs << 2);
m->frames[m->fp].bp = m->sp - n_args;
m->frames[m->fp].nargs = n_args;

END_OP()
