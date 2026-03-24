package linker

import (
	"encoding/binary"
	"errors"
	"fmt"
	"math"

	"github.com/racingthebeam/beam256/toolchain/internal/ft"
)

type Opts struct {
	// Size of memory in bytes
	MemorySize int

	// Number of bits used to encode an address
	// Used for fixup masking
	AddressBits int

	// The linker script
	Script *Script

	InitGenerator InitGenerator

	// Objects to link
	Objects []*ft.Obj

	//
	Sections map[string]InputSection
}

type InitGenerator interface {
	MeasureInit(symbols map[string]bool) int
	GenerateInit(l *Linker) ([]byte, error)
}

type InputSection struct {
	// Raw data for the section
	Data []byte

	// Map of symbol name to offset in section
	Symbols map[string]int

	// List of index entries that require fixup
	Fixups []FixupEntry
}

type FixupEntry struct {
	Call           bool   // is this fixup a function call?
	SymbolName     string // the symbol this fixup points to
	WordByteOffset int    // byte offset of the word containing the fixup value
	BitOffset      int    // bit offset of the address relative to the start of the word
}

type Output struct {
	Image []byte
}

type Linker struct {
	Opts

	ptr         int    // current output pointer
	img         []byte // target memory image
	spans       spans  // track occupied memory regions
	addressMask uint32 // bitmask for address/pointer
	jt          *jumpTable
}

func New(opts *Opts) *Linker {
	return &Linker{
		Opts: *opts,

		ptr:         0,
		img:         make([]byte, opts.MemorySize),
		spans:       spans{Size: opts.MemorySize},
		addressMask: uint32(math.Pow(2, float64(opts.AddressBits))),
		jt:          newJumpTable(),
	}
}

func (l *Linker) Link() (*Output, error) {
	symNames, err := l.getAllSymbolNames()
	if err != nil {
		return nil, err
	}

	initCodeLength := 0
	if l.InitGenerator != nil {
		initCodeLength = l.InitGenerator.MeasureInit(symNames)
	}

	l.ptr = initCodeLength

	for _, line := range l.Script.Lines {
		switch t := line.(type) {
		case Org:
			l.ptr = t.Offset.V
		case Align:
			l.ptr = alignVal(l.ptr, t.Alignment.V)
		case Place:
			section, found := l.Sections[t.Symbol]
			if !found {
				// TODO: report warning?
			} else if !l.spans.AddInterval(l.ptr, len(section.Data)) {
				return nil, errors.New("overlap or overshoot!")
			} else {
				copy(l.img[l.ptr:], section.Data)
			}
			l.setSectionAddress(t.Symbol, l.ptr)
			l.ptr += len(section.Data)
		case Define:
			l.defineLinkerSymbolAtCurrentAddress(t.Symbol)
		case Jump:
			l.ptr += t.Offset.V
		case Reserve:
			if !l.spans.AddInterval(l.ptr, t.Size.V) {
				return nil, errors.New("overlap or overshoot")
			}
			l.ptr += t.Size.V
		}
	}

	for sn, section := range l.Sections {
		for _, fixup := range section.Fixups {
			if fixup.Call {
				// ???
			} else {
				addr, found := l.getSymbolAddress(fixup.SymbolName)
				if !found {
					return nil, fmt.Errorf("symbol not found: %q", fixup.SymbolName)
				}
				base, found := l.getSectionBaseAddress(sn)
				if !found {
					return nil, fmt.Errorf("section not found: %q", sn)
				}
				l.fixup(base+fixup.WordByteOffset, fixup.BitOffset, addr)
			}
		}
	}

	if initCodeLength > 0 {
		initCode, err := l.InitGenerator.GenerateInit(l)
		if err != nil {
			return nil, fmt.Errorf("init code generation failed (%s)", err)
		} else if len(initCode) != initCodeLength {
			return nil, fmt.Errorf("init code length mismatch, got %d, expected %d", len(initCode), initCodeLength)
		}
		copy(l.img[0:initCodeLength], initCode)
	}

	if err := l.renderJumpTable(); err != nil {
		return nil, fmt.Errorf("jump table generation failed: %w", err)
	}

	return &Output{
		Image: l.img,
	}, nil
}

func (l *Linker) fixup(offset int, bitOffset int, addr uint32) {
	val := binary.LittleEndian.Uint32(l.img[offset:])
	val &^= (uint32(l.addressMask) << bitOffset)
	val |= ((addr & l.addressMask) << bitOffset)
	binary.LittleEndian.PutUint32(l.img[offset:], val)
}

const (
	symJumpTableStart = "jump_table_start"
	symJumpTableEnd   = "jump_table_end"
)

func (l *Linker) renderJumpTable() error {
	jt := l.jt.Render()
	if len(jt) == 0 {
		return nil
	}

	start, found := l.getSymbolAddress(symJumpTableStart)
	if !found {
		return fmt.Errorf("missing symbol %q", symJumpTableStart)
	}

	end, found := l.getSymbolAddress(symJumpTableEnd)
	if !found {
		return fmt.Errorf("missing symbol %q", symJumpTableEnd)
	}

	if end < start {
		return fmt.Errorf("%s < %s", symJumpTableEnd, symJumpTableStart)
	}

	if len(jt) > int(end-start) {
		return fmt.Errorf("overflow (%d bytes needed, %d available)", len(jt), end-start)
	}

	copy(l.img[start:], jt)

	return nil
}

func (l *Linker) setSectionAddress(name string, addr int) {

}

func (l *Linker) defineLinkerSymbolAtCurrentAddress(name string) {

}

func (l *Linker) getSymbolAddress(name string) (uint32, bool) {
	return 0, false
}

func (l *Linker) getSectionBaseAddress(sectionName string) (int, bool) {
	return 0, false
}

func (l *Linker) getAllSymbolNames() (map[string]bool, error) {
	out := map[string]bool{}

	for _, line := range l.Script.Lines {
		if def, ok := line.(Define); ok {
			if _, exists := out[def.Symbol]; exists {
				return nil, fmt.Errorf("duplicate symbol %q", def.Symbol)
			}
			out[def.Symbol] = true
		}
	}

	for _, section := range l.Sections {
		for sym := range section.Symbols {
			if _, exists := out[sym]; exists {
				return nil, fmt.Errorf("duplicate symbol %q", sym)
			}
			out[sym] = true
		}
	}

	return out, nil
}
