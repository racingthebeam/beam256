START_OP(OP_MAC_I)
// START-DECODE
// Auto-generated code, do not edit
UWORD r_dst = (ins >> 0) & ((1 << 6) - 1);
UWORD r_val = (ins >> 6) & ((1 << 6) - 1);
WORD imm_scale = ((WORD)(ins << (32 - 12 - 12))) >> (32 - 12);
// END-DECODE

SET_REG(r_dst, REG(r_dst) + REG(r_val) * imm_scale);

END_OP()
