#pragma once

#define OP_NOP          0
#define OP_MOV          1
#define OP_MOV_I        2
#define OP_MOVL         15
#define OP_MOVH         16

// Basic maths operations
// rd = r1 OP r2

#define OP_ADD          3
#define OP_SUB          4
#define OP_MUL          5
#define OP_DIV          6
#define OP_MOD          7

#define OP_AND 8
#define OP_OR 9
#define OP_XOR 10
#define OP_NOT 11
#define OP_SHL 12
#define OP_SHR 13
#define OP_SAR 14

#define OP_UJMP_ADDR 17
#define OP_UJMP_REG 18

#define OP_HALT         255
