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

#define OP_IN 19
#define OP_OUT_I 20
#define OP_OUT_REG 21
#define OP_OUT_REG_MASK 22

#define OP_LOAD_I 23
#define OP_LOAD_REG 24
#define OP_STORE_I 25
#define OP_STORE_REG 26

#define OP_PUSH_I 27
#define OP_PUSH_REG 28
#define OP_POP 29
#define OP_POP_REG 30
#define OP_RSV 31

#define OP_BCALL 32
#define OP_BCALL_DISCARD 33
#define OP_CALL_REG 34
#define OP_NARGS 35
#define OP_RET_I 36
#define OP_RET_REG 37

#define OP_MOV_O 38

#define OP_MUL_S 39
#define OP_DIV_S 40

#define OP_ABS 41
#define OP_NEG 42

#define OP_BSET 43
#define OP_BCLR 44
#define OP_BTOG 45
#define OP_BTST 46

#define OP_BSET_I 47
#define OP_BCLR_I 48
#define OP_BTOG_I 49
#define OP_BTST_I 50

#define OP_STOREXB 51
#define OP_STOREXB_I 52
#define OP_STOREXH 53
#define OP_STOREXH_I 54
#define OP_STOREXW 55
#define OP_STOREXW_I 56

#define OP_LOADXB 57
#define OP_LOADXB_I 58
#define OP_LOADXH 59
#define OP_LOADXH_I 60
#define OP_LOADXW 61
#define OP_LOADXW_I 62

#define OP_STOREFB 63
#define OP_STOREFH 64
#define OP_STOREFW 65
#define OP_LOADFB 66
#define OP_LOADFH 67
#define OP_LOADFW 68

#define OP_MOD_S 69

#define OP_ADD_I 70
#define OP_SUB_I 71
#define OP_MUL_I 72
#define OP_MUL_S_I 73
#define OP_DIV_I 74
#define OP_DIV_S_I 75
#define OP_MOD_I 76
#define OP_MOD_S_I 77
#define OP_AND_I 78
#define OP_OR_I 79
#define OP_XOR_I 80
#define OP_SHL_I 81
#define OP_SHR_I 82
#define OP_SAR_I 83

#define OP_JZ 84
#define OP_JNZ 85
#define OP_JLTZ 86
#define OP_JLEZ 87
#define OP_JGTZ 88
#define OP_JGEZ 89

#define OP_JEQ 90
#define OP_JNE 91
#define OP_JLT 92
#define OP_JLE 93
#define OP_JGT 94
#define OP_JGE 95

#define OP_JEQ_I 96
#define OP_JNE_I 97
#define OP_JLT_I 98
#define OP_JLE_I 99
#define OP_JGT_I 100
#define OP_JGE_I 101

#define OP_JLTU 102
#define OP_JLEU 103
#define OP_JGTU 104
#define OP_JGEU 105

#define OP_STACK_DUP 106
#define OP_STACK_SWP 107

#define OP_SWP 108

#define OP_VJMP 109

#define OP_ACC 110
#define OP_ACC_I 111

#define OP_WAIT 112

#define OP_DUMP   126
#define OP_HALT         127

//
// Extended opcodes

#define OP_CALL_I 0x08
