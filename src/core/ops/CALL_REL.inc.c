START_OP(OP_CALL_REL)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_ret = (ins >> 0) & ((1 << 6) - 1);
WORD imm_rel = ((WORD)(ins << (32 - 12 - 12))) >> (32 - 12);
UWORD n_args = (ins >> 6) & ((1 << 6) - 1);
// END-DECODE

uint32_t ip = m->frames[m->fp].ip;
ip += (imm_rel << 2);

f->r_dst = r_ret;
m->fp++;
m->frames[m->fp].ip = ip;
m->frames[m->fp].bp = m->sp - n_args;
m->frames[m->fp].nargs = n_args;

END_OP()
