package asm

import (
	"errors"
	"fmt"

	"github.com/racingthebeam/beam256/toolchain/internal/ft"
)

type opdef struct {
	Opcode       uint8
	OperandTypes []operandType
	Swizzle      []int
	Encoding     encoder

	FlagSet *FlagSet

	MinOperands, MaxOperands int
	DefaultOperands          []any
}

func (i *opdef) Accepts(operands []any) bool {
	if len(operands) < i.MinOperands || len(operands) > i.MaxOperands {
		return false
	}

	for ix := range operands {
		if !i.OperandTypes[ix].Accepts(operands[ix]) {
			return false
		}
	}

	return true
}

// Generate the instruction opcode
// NOTE: this method may mutate operands.
func (i *opdef) Generate(flags string, operands []any) (uint32, *ft.Ref, error) {
	// Pad operands with missing default values
	for len(operands) < i.MaxOperands {
		operands = append(operands, i.DefaultOperands[len(operands)])
	}

	// Generate flags
	var flagBits int64
	if i.FlagSet != nil {
		if fb, err := i.FlagSet.Encode(flags); err != nil {
			return 0, nil, err
		} else {
			flagBits = fb
		}
	}

	//

	if len(i.Swizzle) > 0 {
		swizzled := make([]int64, len(operands))
		for i, src := range i.Swizzle {
			swizzled[i] = operands[src]
		}
		operands = swizzled
	}

	op := uint32(i.Opcode) << 24
	return op | i.Encoding.Encode(flagBits, operands), nil
}

type operandType interface {
	Accepts(expr any) bool
	Encode(expr any) (uint32, error)
}

type Register struct{}

func (r *Register) Accepts(expr any) bool {
	_, ok := expr.(Reg)
	return ok
}

func (r *Register) Encode(expr any) (uint32, error) {
	reg, ok := expr.(Reg)
	if !ok {
		return 0, fmt.Errorf("operand is not a register")
	}

	ix, err := reg.Index()
	if err != nil {
		return 0, errors.New("named registers are not supported for codegen, this is a bug")
	}

	if ix > 63 {
		return 0, fmt.Errorf("register %d is out of range", ix)
	}

	return uint32(ix), nil
}

type NumOp struct {
	Width  int
	Signed bool
	min    int64
	max    int64
}

func (n *NumOp) Accepts(expr any) bool {
	switch expr.(type) {
	case Ident:
		return n.max >= AddressMax
	case int64:
		return true
	default:
		return false
	}
}

func (n *NumOp) Encode(expr any) (uint32, error) {
	switch t := expr.(type) {
	case Ident:
		return 0, nil // fixup - emit 0 right now, linker will handle
	case int64:
		if t < n.min || t > n.max {
			return 0, fmt.Errorf("value %d of out range (%d..%d)", t, n.min, n.max)
		}
		return uint32(t), nil
	default:
		panic("boom")
	}
}

func S(width int) *NumOp {
	return &NumOp{
		Width:  width,
		Signed: true,

		min: -1 << (width - 1),
		max: (1 << (width - 1)) - 1,
	}
}

func U(width int) *NumOp {
	return &NumOp{
		Width:  width,
		Signed: false,

		min: 0,
		max: (1 << width) - 1,
	}
}
