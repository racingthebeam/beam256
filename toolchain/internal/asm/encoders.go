package asm

import "fmt"

type encoder []componentEncoder

func (e encoder) Encode(flags int64, args []int64) uint32 {
	out := int64(0)

	for _, ce := range e {
		mask := int64((1 << ce.Bits) - 1)
		var src int64
		if ce.SrcArg < 0 {
			src = flags
		} else {
			src = args[ce.SrcArg]
		}
		out |= (src & mask) << ce.Shift
	}

	return uint32(out)
}

func (e encoder) OpMask(operand int) (int, int) {
	for _, ce := range e {
		if ce.SrcArg == operand {
			return ce.Bits, ce.Shift
		}
	}
	panic(fmt.Sprintf("no op mask found for operand %d", operand))
}

const (
	FLAGS = -1
	O0    = 0
	O1    = 1
	O2    = 2
	O3    = 3
)

type componentEncoder struct {
	SrcArg int
	Bits   int
	Shift  int
}

func ce(arg int, bits int, shift int) componentEncoder {
	return componentEncoder{SrcArg: arg, Bits: bits, Shift: shift}
}
