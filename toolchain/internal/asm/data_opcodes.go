package asm

// map each mnemonic to lists of their candidate opcodes
var opcodes = map[string][]*opdef{
	"nop": {
		{
			Encoding: encoders["NONE"],
		},
	},
	"mov": {
		{
			OperandTypes: []operandType{REG, REG},
			Encoding:     encoders["B6_B6"],
		},
		{
			OperandTypes: []operandType{REG, S18},
			Encoding:     encoders["B6_B18"],
		},
	},
}
