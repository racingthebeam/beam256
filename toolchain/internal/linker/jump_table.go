package linker

import "encoding/binary"

type jumpTable struct {
	Entries []uint32
	Index   map[uint32]int
}

func newJumpTable() *jumpTable {
	return &jumpTable{
		Entries: make([]uint32, 0),
		Index:   make(map[uint32]int),
	}
}

func (t *jumpTable) Insert(addr uint32) int {
	ix, exists := t.Index[addr]
	if exists {
		return ix
	}

	ix = len(t.Entries)
	t.Entries = append(t.Entries, addr)
	t.Index[addr] = ix

	return ix
}

func (t *jumpTable) Size() int {
	return len(t.Entries) * 4
}

func (t *jumpTable) Render() []byte {
	out := make([]byte, t.Size())

	wp := 0
	for _, ent := range t.Entries {
		binary.LittleEndian.PutUint32(out[wp:], ent)
		wp += 4
	}

	return out
}
