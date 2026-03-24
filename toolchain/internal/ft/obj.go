package ft

type Obj struct {
	Name     string
	Sections map[string]*Section
	Symbols  map[string]*Symbol
	Refs     []*Ref
}

type Section struct {
	Name string
	Data []byte
}

type Symbol struct {
	Name    string
	Section string
	Offset  int
	Global  bool
}

// RefType represents the types of symbol references that
// object files may contain.
type RefType int

const (
	// Absolute reference - referenced symbol's address is
	// inserted at the target location
	Abs = RefType(1)

	// Function call - linker generates optimised function
	// call opcode, either:
	//   - absolute (first 16KiB)
	//   - relative (+/- 8KiB)
	//   - indirect via jump table (anywhere)
	Call = RefType(3)
)

// Ref denotes a reference to another symbol
type Ref struct {
	Type       RefType // Type of reference - absolute, call etc.
	Section    string
	Offset     int    // Byte offset of WORD containing the reference
	BitOffset  int    // Bit offset within the WORD
	SymbolName string // Referenced symbol name
}
