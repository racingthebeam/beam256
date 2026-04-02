package linker

import (
	"bytes"
	"encoding/binary"
	"testing"

	"github.com/racingthebeam/beam256/toolchain/internal/ft"
	"github.com/stretchr/testify/assert"
)

type testInitGen struct{}

func (t *testInitGen) MeasureInit(l *Linker) int { return 4 }

func (t *testInitGen) GenerateInit(l *Linker) ([]byte, error) {
	return []byte{0xCA, 0xFE, 0xBA, 0xBE}, nil
}

func TestLinker1(t *testing.T) {
	script := `
i
@ 6
d foo_start
p foo
d foo_end

j 30
a 4
d bar_start
p bar
d bar_end
	`

	objs := []*ft.Obj{
		{
			Name: "obj1",
			Sections: map[string]*ft.ObjSect{
				"foo": {
					Name: "foo",
					Data: []byte{1, 2, 3, 4, 5, 6},
				},
				"bar": {
					Name: "bar",
					Data: []byte{0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0xFF},
				},
			},
			Symbols: map[ft.Symbol]*ft.ObjSym{
				"quux": {
					Name:    "quux",
					Section: "foo",
					Offset:  2,
				},
				"ralf": {
					Name:    "ralf",
					Section: "foo",
					Offset:  4,
				},
				"benji": {
					Name:    "benji",
					Section: "bar",
					Offset:  0,
				},
			},
			Refs: []*ft.Ref{
				{
					Type:             ft.Abs,
					SourceSection:    "bar",
					SourceByteOffset: 2,
					SourceBitOffset:  10,
					TargetSymbol:     "toto",
				},
			},
		},
		{
			Name: "obj2",
			Sections: map[string]*ft.ObjSect{
				"foo": {
					Name: "foo",
					Data: []byte{7, 8, 9, 10, 11, 12, 13, 14, 15, 16},
				},
			},
			Symbols: map[ft.Symbol]*ft.ObjSym{
				"toto": {
					Name:    "toto",
					Section: "foo",
					Offset:  4,
				},
				"casper": {
					Name:    "casper",
					Section: "foo",
					Offset:  8,
				},
			},
			Refs: []*ft.Ref{},
		},
	}

	linker := New(&Opts{
		MemorySize:    64,
		AddressBits:   18,
		Script:        MustParse("test.lnk", bytes.NewReader([]byte(script))),
		InitGenerator: &testInitGen{},
		Objects:       objs,
	})

	res, err := linker.Link()

	assert.Nil(t, err)

	expect := []byte{
		0xCA, 0xFE, 0xBA, 0xBE, 0, 0, 1, 2,
		3, 4, 5, 6, 7, 8, 9, 10,
		11, 12, 13, 14, 15, 16, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0,

		0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0xFF, 0,
		0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0,
	}

	// Hacky fixup test
	// Generate the "fixed up" value based on the address the referenced
	// symbol lands at, then punch it into the reference.
	fixTest := uint32(0x55_54_53_52)
	fixTarg := mustFind(linker.GetGlobalSymbolAddress("toto"))
	fixTest &^= 0x3FFFF << 10
	fixTest |= uint32(fixTarg) << 10
	binary.LittleEndian.PutUint32(expect[34:], fixTest)

	assert.Equal(t, expect, res.Image)

	assert.Equal(t, 6, mustFind(linker.GetGlobalSymbolAddress("foo_start")))
	assert.Equal(t, 22, mustFind(linker.GetGlobalSymbolAddress("foo_end")))

	assert.Equal(t, 32, mustFind(linker.GetGlobalSymbolAddress("bar_start")))
	assert.Equal(t, 39, mustFind(linker.GetGlobalSymbolAddress("bar_end")))

	assert.Equal(t, 8, mustFind(linker.GetGlobalSymbolAddress("quux")))
	assert.Equal(t, 10, mustFind(linker.GetGlobalSymbolAddress("ralf")))
	assert.Equal(t, 16, mustFind(linker.GetGlobalSymbolAddress("toto")))
	assert.Equal(t, 20, mustFind(linker.GetGlobalSymbolAddress("casper")))

	assert.Equal(t, 32, mustFind(linker.GetGlobalSymbolAddress("benji")))
}
