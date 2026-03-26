package asm

import (
	"encoding/binary"
)

type DebugStringTable struct {
	maxSize     int            // maximum byte size of string table (index + strings)
	strings     []string       // list of strings in string table
	lookup      map[string]int // map strings to index - for duplicate checks
	stringsSize int            // byte size of all strings, including null-terminators
}

func NewDebugStringTable(maxSize int) *DebugStringTable {
	tbl := &DebugStringTable{
		maxSize:     maxSize,
		strings:     make([]string, 0),
		lookup:      map[string]int{},
		stringsSize: 0,
	}

	// first entry (0) is always an "error" symbol
	// we sub this in circumstances where the user attempts
	// to add a string that won't fit in the string table.
	tbl.Add("!")

	return tbl
}

func (t *DebugStringTable) Size() int {
	return (len(t.lookup) * 2) + t.stringsSize
}

func (t *DebugStringTable) Add(str string) (int, bool) {
	ix, found := t.lookup[str]
	if found {
		return ix, true
	}

	// cost of each string is:
	// 2 bytes for the index entry, plus
	// length of string + NULL terminator
	cost := 2 + len(str) + 1

	if cost+t.Size() > t.maxSize {
		return 0, false
	}

	ix = len(t.strings)
	t.strings = append(t.strings, str)
	t.lookup[str] = ix
	t.stringsSize += (len(str) + 1)

	return ix, true
}

func (t *DebugStringTable) Render() []byte {
	out := make([]byte, t.Size())
	wp := len(t.lookup) * 2

	for ix, str := range t.strings {
		binary.LittleEndian.PutUint16(out[(ix*2):], uint16(wp))
		copy(out[wp:], str)
		wp += len(str) + 1
	}

	if wp != len(out) {
		panic("wp != len(out) - this is a bug")
	}

	return out
}
