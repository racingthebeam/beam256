START_OP(OP_CALL)
// START-DECODE
// Auto-generated code, do not edit
UWORD flags = (ins >> 22) & ((1 << 2) - 1);
UWORD r_ret = (ins >> 0) & ((1 << 6) - 1);
UWORD r_fn = (ins >> 6) & ((1 << 6) - 1);
UWORD n_args = (ins >> 12) & ((1 << 6) - 1);
// END-DECODE

f->r_dst = r_ret;
m->fp++;
m->frames[m->fp].ip = REG(r_fn);
m->frames[m->fp].bp = m->sp - n_args;
m->frames[m->fp].nargs = n_args;

END_OP()
