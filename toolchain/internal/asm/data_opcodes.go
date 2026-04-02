package asm

import "github.com/racingthebeam/beam256/toolchain/internal/ft"

// map each mnemonic to lists of their candidate opcodes
var opcodes = map[string][]*opdef{
	"halt": {
		{
			Opcode:     1,
			Encoding:   encoders["NONE"],
			FlagSet:    flagSets["HALT"],
			FixupIndex: -1,
		},
	},
	"nop": {
		{
			Opcode:     2,
			Encoding:   encoders["NONE"],
			FixupIndex: -1,
		},
	},
	"mov": {
		{
			Opcode:       3,
			OperandTypes: []operandType{REG, REG},
			Encoding:     encoders["B6_B6"],
			MinOperands:  2,
			MaxOperands:  2,
			FixupIndex:   -1,
		},
		{
			Opcode:       4,
			OperandTypes: []operandType{REG, S18},
			Encoding:     encoders["B6_B18"],
			MinOperands:  2,
			MaxOperands:  2,
			FixupIndex:   -1,
		},
	},
	"jnz": {
		{
			Opcode:         5,
			OperandTypes:   []operandType{REG, S16},
			FlagSet:        flagSets["REL_JMP"],
			Encoding:       encoders["F2_B6_B16"],
			MinOperands:    2,
			MaxOperands:    2,
			FixupIndex:     1,
			FixupType:      ft.PCRelJmp,
			FixupBitOffset: 0,
			FixupWidth:     16,
		},
	},
	"print": {
		{
			Opcode:         6,
			OperandTypes:   []operandType{U12, REG, REG},
			Encoding:       encoders["B12_B6_B6"],
			MinOperands:    1,
			MaxOperands:    3,
			DefaultOperand: SentinelRegister,
			FixupIndex:     -1,
		},
	},
}
