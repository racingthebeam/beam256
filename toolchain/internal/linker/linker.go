package linker

import (
	"encoding/binary"
	"errors"
	"fmt"
	"math"

	"github.com/alecthomas/participle/v2/lexer"
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
}

type InitGenerator interface {
	MeasureInit(l *Linker) int
	GenerateInit(l *Linker) ([]byte, error)
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
	objs        []*objState

	// map global symbols to the object's that define them
	globalSymbols map[ft.Symbol]int

	// linker symbols are defined at the linker level
	// we treat them specially, just storing their addresses
	linkerSymbols map[ft.Symbol]int

	// sections that have been placed
	placedSections map[string]bool

	initCodePresent bool
	initCodeLength  int
	initCodeTargets []int
}

type objState struct {
	Object                 *ft.Obj
	SectionRelocationTable map[string]int
}

func (os *objState) GetSymbolAddress(sym ft.Symbol) (int, bool) {
	// Symbol not in symbol table => not found
	symInfo, found := os.Object.Symbols[sym]
	if !found {
		return 0, false
	}

	// Symbol's declaring section not placed by linker => not found
	sectionBase, found := os.SectionRelocationTable[symInfo.Section]
	if !found {
		return 0, false
	}

	// Symbol found; absolute address is section placement addr + offset
	return sectionBase + symInfo.Offset, true
}

func New(opts *Opts) *Linker {
	objs := make([]*objState, len(opts.Objects))
	for i := range opts.Objects {
		objs[i] = &objState{
			Object:                 opts.Objects[i],
			SectionRelocationTable: map[string]int{},
		}
	}

	return &Linker{
		Opts: *opts,

		ptr:             0,
		img:             make([]byte, opts.MemorySize),
		spans:           spans{Size: opts.MemorySize},
		addressMask:     uint32(math.Pow(2, float64(opts.AddressBits)) - 1),
		jt:              newJumpTable(),
		objs:            objs,
		globalSymbols:   map[ft.Symbol]int{},
		linkerSymbols:   map[ft.Symbol]int{},
		placedSections:  map[string]bool{},
		initCodePresent: false,
		initCodeLength:  0,
		initCodeTargets: nil,
	}
}

func (l *Linker) HasGlobalSymbol(sym ft.Symbol) bool {
	if sym.IsPrivate() {
		return false
	}

	_, f1 := l.globalSymbols[sym]
	_, f2 := l.linkerSymbols[sym]

	return f1 || f2
}

func (l *Linker) GetGlobalSymbolAddress(sym ft.Symbol) (int, bool) {
	// If the symbol was defined by the linker script, finding
	// the address is simply a case of looking it up in the map.
	addr, found := l.linkerSymbols[sym]
	if found {
		return addr, true
	}

	// Otherwise, find the object that defined the symbol...
	obj, found := l.globalSymbols[sym]
	if !found {
		return 0, false
	}

	// ...and look up the address from its linker state
	return l.objs[obj].GetSymbolAddress(sym)
}

func (l *Linker) Link() (*Output, error) {
	if err := l.buildGlobalSymbolTable(); err != nil {
		return nil, err
	}

	l.measureInitCode()

	if err := l.processScript(); err != nil {
		return nil, err
	}

	if err := l.doFixups(); err != nil {
		return nil, err
	}

	if err := l.renderInitCode(); err != nil {
		return nil, err
	}

	if err := l.renderJumpTable(); err != nil {
		return nil, err
	}

	return &Output{
		Image: l.img,
	}, nil
}

func (l *Linker) buildGlobalSymbolTable() error {
	for objIx, os := range l.objs {
		for sym := range os.Object.Symbols {
			if !sym.IsPublic() {
				continue
			}
			if _, exists := l.globalSymbols[sym]; exists {
				// TODO: better error message
				return fmt.Errorf("duplicate global symbol %q", sym)
			}
			l.globalSymbols[sym] = objIx
		}
	}
	return nil
}

func (l *Linker) measureInitCode() {
	if l.InitGenerator == nil {
		l.initCodePresent = false
		return
	}

	l.initCodePresent = true
	l.initCodeLength = l.InitGenerator.MeasureInit(l)
}

func (l *Linker) processScript() error {
	for _, line := range l.Script.Lines {
		switch t := line.(type) {
		case *Init:
			if !l.initCodePresent {
				return l.wrapError(t.Tok, errors.New("requested init code but none present"))
			}
			l.initCodeTargets = append(l.initCodeTargets, l.ptr)
			l.ptr += l.initCodeLength
		case *Org:
			l.ptr = t.Offset.V
		case *Align:
			l.ptr = alignVal(l.ptr, t.Alignment.V)
		case *Place:
			if err := l.placeSection(t.Symbol); err != nil {
				return l.wrapError(t.Tok, err)
			}
		case *AbsoluteJumpForward:
			if l.ptr > t.Offset.V {
				return l.wrapError(t.Tok, fmt.Errorf("jump to %d requested, but pointer is already at %d", t.Offset.V, l.ptr))
			}
			l.ptr = t.Offset.V
		case *RelativeJump:
			l.ptr += t.Offset.V
		case *Define:
			if err := l.addLinkerSymbolAtCurrentPointer(ft.Symbol(t.Symbol)); err != nil {
				return l.wrapError(t.Tok, err)
			}
		case *Reserve:
			if !l.spans.AddInterval(l.ptr, t.Size.V) {
				return l.wrapError(t.Tok, fmt.Errorf("reserving %d bytes from %d would overlap with existing data", l.ptr, t.Size.V))
			}
			l.ptr += t.Size.V
		}
	}

	return nil
}

func (l *Linker) wrapError(t lexer.Token, err error) error {
	return fmt.Errorf("line %d: %w", t.Pos.Line, err)
}

func (l *Linker) renderInitCode() error {
	if l.InitGenerator == nil {
		return nil
	}

	initCode, err := l.InitGenerator.GenerateInit(l)
	if err != nil {
		return err
	}

	for _, t := range l.initCodeTargets {
		copy(l.img[t:], initCode)
	}

	return nil
}

func (l *Linker) placeSection(name string) error {
	if l.placedSections[name] {
		return fmt.Errorf("section %q already placed", name)
	}

	for _, obj := range l.objs {
		section, exists := obj.Object.Sections[name]
		if !exists {
			continue
		}
		if !l.spans.AddInterval(l.ptr, len(section.Data)) {
			return errors.New("overlap error")
		}
		copy(l.img[l.ptr:], section.Data)
		obj.SectionRelocationTable[name] = l.ptr
		l.ptr += len(section.Data)
	}

	l.placedSections[name] = true

	return nil
}

func (l *Linker) doFixups() error {
	for _, obj := range l.objs {
		if err := l.fixupObj(obj); err != nil {
			return err
		}
	}
	return nil
}

func (l *Linker) fixupObj(os *objState) error {
	for _, ref := range os.Object.Refs {
		var (
			addr  int
			found bool
		)

		if ref.TargetSymbol.IsPrivate() {
			addr, found = os.GetSymbolAddress(ref.TargetSymbol)
		} else {
			addr, found = l.GetGlobalSymbolAddress(ref.TargetSymbol)
		}

		if !found {
			return fmt.Errorf("undefined symbol %q", ref.TargetSymbol)
		}

		sectionBaseAddr, placed := os.SectionRelocationTable[ref.SourceSection]
		if !placed {
			return fmt.Errorf("section %q is not placed!", ref.SourceSection)
		}

		wordOffset := sectionBaseAddr + ref.SourceByteOffset

		switch ref.Type {
		case ft.Abs:
			l.fixupAbs(wordOffset, ref.SourceBitOffset, uint32(addr))
		case ft.PCRelJmp:
			if err := l.fixupRel(wordOffset, ref.SourceBitOffset, ref.SourceWidth, addr); err != nil {
				return err
			}
		case ft.Call:
			l.fixupCall(wordOffset, addr)
		default:
			panic(fmt.Errorf("unknown fixup type %d", ref.Type))
		}
	}

	return nil
}

func (l *Linker) patch(wordOffset int, bitOffset int, mask uint32, val uint32) {
	curr := binary.LittleEndian.Uint32(l.img[wordOffset:])
	curr &^= (mask << bitOffset)
	curr |= ((val & mask) << bitOffset)
	binary.LittleEndian.PutUint32(l.img[wordOffset:], curr)
}

func (l *Linker) fixupAbs(wordOffset int, bitOffset int, addr uint32) {
	l.patch(wordOffset, bitOffset, l.addressMask, addr)
}

func (l *Linker) fixupRel(wordOffset int, bitOffset, width int, target int) error {
	delta := target - (wordOffset + 4)

	bits, err := relJmpBits(width, delta)
	if err != nil {
		return err
	}

	l.patch(wordOffset, bitOffset, bitmask(width), bits)

	return nil
}

func (l *Linker) fixupCall(offset int, callee int) {
	ins := binary.LittleEndian.Uint32(l.img[offset:])
	delta := offset - callee

	if callee < 16384 {
		ins = l.patchAbsCall(ins, uint32(callee))
	} else if delta >= -8192 && delta < 8192 {
		ins = l.patchRelCall(ins, delta)
	} else {
		ins = l.patchIndirectCall(ins, uint32(callee))
	}
}

const (
	opMask    = 0xFF_00_00_00
	callAbsOp = 0x01_00_00_00
	callRelOp = 0x02_00_00_00
	callIndOp = 0x03_00_00_00

	callFnMask  = 0xFFF
	callFnShift = 6
)

func (l *Linker) patchAbsCall(ins uint32, addr uint32) uint32 {
	return l.patchCall(callAbsOp, ins, addr>>2)
}

func (l *Linker) patchRelCall(ins uint32, delta int) uint32 {
	return l.patchCall(callRelOp, ins, relCallBits(delta))
}

func (l *Linker) patchIndirectCall(ins uint32, addr uint32) uint32 {
	idx := l.jt.Insert(addr)
	return l.patchCall(callIndOp, ins, uint32(idx))
}

func (l *Linker) patchCall(opcode uint32, ins uint32, bits uint32) uint32 {
	ins &^= opMask
	ins |= opcode

	ins &^= (callFnMask << callFnShift)
	ins |= ((bits & callFnMask) << callFnShift)

	return ins
}

func (l *Linker) addLinkerSymbolAtCurrentPointer(sym ft.Symbol) error {
	if l.HasGlobalSymbol(sym) {
		return fmt.Errorf("duplicate symbol %q", sym)
	}
	l.linkerSymbols[sym] = l.ptr
	return nil
}

const (
	symJumpTableStart = "jump_table_base"
	symJumpTableEnd   = "jump_table_end"
)

func (l *Linker) renderJumpTable() error {
	jt := l.jt.Render()
	if len(jt) == 0 {
		return nil
	}

	start, found := l.GetGlobalSymbolAddress(symJumpTableStart)
	if !found {
		return fmt.Errorf("missing symbol %q", symJumpTableStart)
	}

	end, found := l.GetGlobalSymbolAddress(symJumpTableEnd)
	if !found {
		return fmt.Errorf("missing symbol %q", symJumpTableEnd)
	}

	if end < start {
		return fmt.Errorf("%s < %s", symJumpTableEnd, symJumpTableStart)
	} else if len(jt) > int(end-start) {
		return fmt.Errorf("overflow (%d bytes needed, %d available)", len(jt), end-start)
	}

	copy(l.img[start:], jt)

	return nil
}
