package asm

const (
	AddressBits = 18
	AddressMax  = (1 << AddressBits) - 1

	OpcodeShift = 24

	RegMax = 63

	SentinelRegister = NumReg(RegMax)
)
