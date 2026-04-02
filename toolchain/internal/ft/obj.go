package ft

type Symbol string

func (s Symbol) IsPublic() bool  { return !s.IsPrivate() }
func (s Symbol) IsPrivate() bool { return s[0] == '_' }

type Obj struct {
	Name string

	// Sections defined in the object
	Sections map[string]*ObjSect

	// Symbols defined by the object, local & global
	Symbols map[Symbol]*ObjSym

	// References to symbols
	Refs []*Ref
}

type ObjSect struct {
	Name string
	Data []byte
}

type ObjSym struct {
	Name    Symbol // Symbol name
	Section string // Section in which symbol is declared
	Offset  int    // Symbol byte offset within declaring section
}

// RefType represents the types of symbol references that
// object files may contain.
type RefType int

const (
	// Absolute reference - referenced symbol's address is
	// inserted at the target location
	Abs = RefType(1)

	// PC Relative jump - relative number of *instructions* to
	// PC is inserted at the target location.
	PCRelJmp = RefType(2)

	// Function call - linker generates optimised function
	// call opcode, either:
	//   - absolute (first 16KiB)
	//   - relative (+/- 8KiB)
	//   - indirect via jump table (anywhere)
	Call = RefType(3)
)

// Ref denotes a reference to another symbol
type Ref struct {
	Type RefType // Type of reference - absolute, call etc.

	SourceSection    string
	SourceByteOffset int // Byte offset of WORD containing the reference
	SourceBitOffset  int // Bit offset within the WORD

	// Number of bits available to store the value
	// This is only used when Type = PCRelJmp, since depending on opcode,
	// the jump range is 9, 12, or 16 bits
	//
	// Abs references are always 18 bits, and Calls are always 12
	SourceWidth int

	TargetSymbol Symbol // Referenced symbol name
}
