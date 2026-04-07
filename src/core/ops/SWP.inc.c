START_OP(OP_SWP)
// START-DECODE
// Auto-generated code, do not edit
// END-DECODE

WORD tos, sos;
tos = m->stack[m->sp-1];
sos = m->stack[m->sp-2];
m->stack[m->sp-1] = sos;
m->stack[m->sp-2] = tos;

END_OP()
