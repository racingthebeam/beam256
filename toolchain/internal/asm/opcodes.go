package asm

import (
	"fmt"

	"github.com/racingthebeam/beam256/toolchain/internal/ft"
)

type opdef struct {
	Opcode uint8

	OperandTypes []operandType

	// FlagSet - nil if this opcode does not have any flags
	FlagSet *FlagSet

	// Some instructions (e.g. PUSH) support a variable number of operands
	// at the assembly level. If the number of actual operands is less than
	// MaxOperands, the remainder will be filled out with DefaultOperand
	MinOperands, MaxOperands int
	DefaultOperand           any

	// this is the pre-swizzled index of the operand that supports fixup
	// if a label is encountered in this position, a fixup will be emitted
	// -1 if fixup is not supported for any operand
	FixupIndex int

	FixupType      ft.RefType // fixup type e.g. relative, absolute, call
	FixupBitOffset int        // bit offset for fixup (post-swizzle)
	FixupWidth     int        // fixup width (post-swizzle)

	// Swizzle allows operand order to be juggled before encoding.
	// Slice is indices to pluck from input operand list.
	//
	// If nil, no swizzling is performed.
	Swizzle []int

	// Encoder - turns flags and (swizzled) operands into encoded instruction
	Encoding encoder
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
		operands = append(operands, i.DefaultOperand)
	}

	// Generate flags
	var flagBits uint32
	if i.FlagSet != nil {
		if fb, err := i.FlagSet.Encode(flags); err != nil {
			return 0, nil, err
		} else {
			flagBits = fb
		}
	}

	// Encode all operands
	encoded := make([]uint32, len(operands))
	for ix := range operands {
		e, err := i.OperandTypes[ix].Encode(operands[ix])
		if err != nil {
			return 0, nil, fmt.Errorf("failed to encode operand at index %d: %s", ix, err)
		}
		encoded[ix] = e
	}

	// Swizzle into correct order if required
	if len(i.Swizzle) > 0 {
		swizzled := make([]uint32, len(encoded))
		for i, src := range i.Swizzle {
			swizzled[i] = encoded[src]
		}
		encoded = swizzled
	}

	// If opcode declares a fixup index, and there's a label in that
	// operand, emit a fixup
	var fu *ft.Ref
	if i.FixupIndex >= 0 {
		if target, isLabel := operands[i.FixupIndex].(Ident); isLabel {
			fu = &ft.Ref{
				Type:            i.FixupType,
				SourceBitOffset: i.FixupBitOffset,
				SourceWidth:     i.FixupWidth,
				TargetSymbol:    ft.Symbol(target),
			}
		}
	}

	if i.Encoding == nil {
		panic(fmt.Errorf("NIL ENCODING FOR OPCODE %d", i.Opcode))
	}

	op := uint32(i.Opcode) << OpcodeShift
	return op | i.Encoding.Encode(flagBits, encoded), fu, nil
}

// Represents an operand type
type operandType interface {
	// Accepts() returns true if the operand is capable of encoding
	// the given expression. Integer range checks are not performed.
	Accepts(expr any) bool

	// Encode the given expression into a bit pattern suitable for
	// inclusion in an instruction, anchored to bit offset 0.
	//
	// Returns an error if the given expression cannot be encoded
	// by the type; this will occur, for example, if an integer
	// value is out of the range that can be represented by a
	// numeric type.
	//
	// For expressions that require fix-up, the convention is to
	// return zero.
	Encode(expr any) (uint32, error)
}

type Register struct{}

func (r *Register) Accepts(expr any) bool {
	_, ok := expr.(NumReg)
	return ok
}

func (r *Register) Encode(expr any) (uint32, error) {
	reg, ok := expr.(NumReg)
	if !ok {
		return 0, fmt.Errorf("operand is not a register")
	}

	if reg > RegMax {
		return 0, fmt.Errorf("register %d is out of range", reg)
	}

	return uint32(reg), nil
}

// CallTarget is an operand type representing the target of a CALL instruction
type CallTarget struct{}

func (c *CallTarget) Accepts(expr any) bool {
	// CallTarget accepts ONLY a label
	//
	// Raw integers are not accepted because it's impossible to determine
	// if the they represent absolute, relative, or indirect addresses, so
	// there is no way to select the correct opcode to emit.
	//
	// REVIEW: if this becomes an issue, CALL could become a virtual mnemonic
	// that maps to mnemonics CALL_REL, CALL_ABS, CALL_IND (at the moment these
	// exist only as opcodes which share a single mnemonic). Exposing the
	// individual opcodes with their own mnemonics allows the programmer to
	// select them explicitly if the situation requires it.
	//
	// Other workarounds: use .op or .ins directives to manually encode the
	// correct opcode.
	_, ok := expr.(Ident)
	return ok
}

func (c *CallTarget) Encode(expr any) (uint32, error) {
	return 0, nil // value will always be fixed up by the linker so just emit 0
}

type RelJmpTarget struct {
	Width    int
	min, max int64
}

type NumOp struct {
	Width    int
	Signed   bool
	min, max int64
}

func (n *NumOp) Accepts(expr any) bool {
	switch expr.(type) {
	case Ident:
		return true
		// return n.max >= AddressMax
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
