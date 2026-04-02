package asm

import (
	"fmt"

	"github.com/racingthebeam/beam256/toolchain/internal/ft"
)

const (
	LabelSymbol = 1 + iota
	DefineSymbol
)

type SymbolTableEntry struct {
	Type int

	Section string
	Offset  int

	Value int64
}

func (st SymbolTableEntry) Valid() bool   { return st.Type > 0 }
func (st SymbolTableEntry) IsLabel() bool { return st.Type == LabelSymbol }
func (st SymbolTableEntry) IsDef() bool   { return st.Type == DefineSymbol }

type SymbolTable struct {
	Parent  *SymbolTable
	Symbols map[ft.Symbol]SymbolTableEntry
}

func NewSymbolTable() *SymbolTable {
	return &SymbolTable{
		Symbols: map[ft.Symbol]SymbolTableEntry{},
	}
}

func (st *SymbolTable) Beget() *SymbolTable {
	return &SymbolTable{
		Parent:  st,
		Symbols: map[ft.Symbol]SymbolTableEntry{},
	}
}

func (st *SymbolTable) Lookup(sym ft.Symbol) (SymbolTableEntry, bool) {
	ent, found := st.Symbols[sym]
	if found {
		return ent, true
	}

	if st.Parent == nil {
		return SymbolTableEntry{}, false
	}

	return st.Parent.Lookup(sym)
}

func (st *SymbolTable) AddLabel(ref Ref, name ft.Symbol, section string, offset int) bool {
	if st.has(name) {
		return false
	}
	st.Symbols[name] = SymbolTableEntry{
		Type:    LabelSymbol,
		Section: section,
		Offset:  offset,
	}
	return true
}

func (st *SymbolTable) AddDef(ref Ref, name ft.Symbol, value int64) bool {
	if st.has(name) {
		return false
	}
	st.Symbols[name] = SymbolTableEntry{
		Type:  DefineSymbol,
		Value: value,
	}
	return true
}

func (st *SymbolTable) RemoveDef(sym ft.Symbol) error {
	ent, ok := st.Symbols[sym]
	if !ok {
		return nil
	}

	if ent.Type != DefineSymbol {
		return fmt.Errorf("cannot undefine symbol %q as it is not a definition", sym)
	}

	delete(st.Symbols, sym)

	return nil
}

func (st *SymbolTable) has(sym ft.Symbol) bool {
	_, exists := st.Symbols[sym]
	return exists
}
