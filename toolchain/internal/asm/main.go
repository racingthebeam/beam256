package asm

import (
	"errors"
	"fmt"
	"io/fs"
	"log"

	"github.com/racingthebeam/beam256/toolchain/internal/ft"
	"github.com/racingthebeam/beam256/toolchain/internal/mergefs"
)

type Opts struct {
	// Filesystem hosting files to be assembled.
	// Will be merged with "builtin" filesystem for accessing
	// bundled include files.
	FS fs.FS

	// Debug build
	// If true, PRINT, DUMP, and HALT.B statements will remain
	// in the output. Otherwise, they're stripped.
	Debug bool

	// String table to receive debug strings.
	// This is injected so that debug strings can be shared
	// across compilation units.
	DebugStringTable *DebugStringTable
}

type Assembler struct {
	Files         *fileStack
	ActiveSection *sectionWriter
	FileSymbols   *SymbolTable
	Debug         bool
	Scope         Scope

	fs       fs.FS
	strings  *DebugStringTable
	sections map[string]*sectionWriter
	refs     []*ft.Ref
}

func New(opts *Opts) *Assembler {
	return &Assembler{
		Files:         newFileStack(CompileOpts{}),
		ActiveSection: nil,
		FileSymbols:   NewSymbolTable(),
		Debug:         opts.Debug,

		fs:       mergefs.Merge(builtinFS, opts.FS),
		strings:  opts.DebugStringTable,
		sections: map[string]*sectionWriter{},
	}
}

func (a *Assembler) SetSection(name string) {
	sw, exists := a.sections[name]
	if !exists {
		sw = &sectionWriter{Name: name}
		a.sections[name] = sw
	}
	a.ActiveSection = sw
}

func (a *Assembler) Assemble(entryPoint string) (*ft.Obj, error) {
	a.Scope = &RootScope{
		A: a,
	}

	if err := a.Scope.Include(entryPoint); err != nil {
		return nil, err
	}

	return a.toOBJ(entryPoint)
}

func (a *Assembler) ReadAndParse(filename string) (*Program, error) {
	fh, err := a.fs.Open(filename)
	if err != nil {
		return nil, err
	}

	defer fh.Close()

	p, err := NewParser(filename, fh)
	if err != nil {
		return nil, fmt.Errorf("failed to create parser: %s", err)
	}

	prog, err := p.ParseProgram()
	if err != nil {
		return nil, err
	}

	return prog, nil
}

func (a *Assembler) AssembleStatements(stmts []any) error {
	for _, stmt := range stmts {
		switch t := stmt.(type) {
		case *DirInclude:
			if err := a.Scope.Include(t.Filename); err != nil {
				return err
			}
			continue
		case *DirSection:
			if err := a.Scope.Section(t.Name); err != nil {
				return err
			}
			continue
		case *DirDefine:
			sym := ft.Symbol(t.Ident)
			if sym.IsPublic() {
				// REVIEW: is this restriction necessary?
				return fmt.Errorf("invalid definition name %q - definitions must be global symbols", sym)
			} else if val, err := a.eval(t.Value); err != nil {
				return err
			} else if !a.FileSymbols.AddDef(Ref{}, sym, val) {
				return fmt.Errorf("duplicate symbol %q", t.Ident)
			}
			continue
		case *DirUndefine:
			if err := a.FileSymbols.RemoveDef(ft.Symbol(t.Ident)); err != nil {
				return err
			}
			continue
		case *DirPushOpt:
			continue
		case *DirSetOpt:
			continue
		case *DirPopOpt:
			continue
		}

		// all the other statement types require an active section
		// (this is indepdendent of scope)
		if a.ActiveSection == nil {
			return fmt.Errorf("no active section!")
		}

		switch t := stmt.(type) {
		case *DirAlign:
			a.ActiveSection.Align(t.Alignment)
		case *DirZeroes:
			if count, err := a.eval(t.Count); err != nil {
				return err
			} else {
				a.ActiveSection.WriteZeroes(count)
			}
		case *DirWords:
			if err := a.writeData(t.Values, a.ActiveSection.WriteWords); err != nil {
				return err
			}
		case *DirHalfWords:
			if err := a.writeData(t.Values, a.ActiveSection.WriteHalfWords); err != nil {
				return err
			}
		case *DirBytes:
			if err := a.writeData(t.Values, a.ActiveSection.WriteBytes); err != nil {
				return err
			}
		case *FnDef:
			if err := a.Scope.FnDef(t); err != nil {
				return err
			}
		case Label:
			if err := a.Scope.Label(ft.Symbol(t)); err != nil {
				return err
			}
		case *Instruction:
			if err := a.writeInstruction(t); err != nil {
				return err
			}
		case *Print:
			if a.Debug {
				idx, _ := a.strings.Add(t.String)
				operands := []any{Int(idx)}
				if err := a.writeInstruction(&Instruction{
					Mnemonic: "print",
					Flags:    "",
					Operands: append(operands, t.Operands...),
				}); err != nil {
					return err
				}
			}
		default:
			panic(fmt.Errorf("unknown AST node type %T", t))
		}
	}

	return nil
}

func (a *Assembler) writeData(exprs []any, writer func([]int64) error) error {
	vals := make([]int64, 0, len(exprs))
	for i, exp := range exprs {
		if str, ok := exp.(string); ok {
			for _, b := range str {
				vals = append(vals, int64(b))
			}
		} else {
			val, err := a.eval(exprs[i])
			if err != nil {
				return err
			}
			vals = append(vals, val)
		}
	}

	return writer(vals)
}

func (a *Assembler) writeInstruction(ins *Instruction) error {
	log.Printf("WRITE: %+v", ins)

	candidates := opcodes[ins.Mnemonic]
	if candidates == nil {
		return fmt.Errorf("unknown mnemonic %q", ins.Mnemonic)
	}

	//
	// Step 1 - resolve

	// actual operand values, this will contain:
	//   - int64 (evaluated values)
	//   - Reg (always numeric)
	//   - Ident (label reference)
	actualOperands := make([]any, len(ins.Operands))

	for i, op := range ins.Operands {
		switch t := op.(type) {
		case Ident:
			ent, ok := a.FileSymbols.Lookup(ft.Symbol(t))
			if !ok {
				return fmt.Errorf("unknown symbol: %q", t)
			}
			switch {
			case ent.IsDef():
				actualOperands[i] = ent.Value
			case ent.IsLabel():
				actualOperands[i] = t
			default:
				panic(fmt.Errorf("unhandled symbol type %d - this is a bug!", ent.Type))
			}
		case *AutoScratchExp:
			// TODO: update scope interface to return name of indexed scratch
			// register (this should update the internal locals). The root
			// scope will return an error
			if labelName, isLabel := a.exprIsLabel(t.Exp); isLabel {
				log.Printf("AUTO SCRATCH LABEL: %s", labelName)
				// generate 1 x fixup with MOVA + label reference
				// update operand to use scratch0
			} else {
				val, err := a.eval(t.Exp)
				if err != nil {
					return fmt.Errorf("failed to evaluate auto-scratch expression for operand at index %d (%s)", i, err)
				}
				// TODO: inspect value to work out how many instructions we need
				// If val is > threshold for single immediate form, split into MOVL and MOVH
				log.Printf("AUTO SCRATCH VAL: %d", val)
			}
			return errors.New("AUTO SCRATCH IS NOT SUPPORTED!")
		case NamedReg:
			resolved, err := a.Scope.ResolveNamedReg(t)
			if err != nil {
				return err
			}
			actualOperands[i] = resolved
		case NumReg:
			actualOperands[i] = t
		default:
			// this covers binary expressions, unary expressions, plus literals
			if val, err := a.eval(op); err != nil {
				return fmt.Errorf("failed to evaluate operand at index %d (%s)", i, err)
			} else {
				actualOperands[i] = val
			}
		}
	}

	//
	// Step 2 - find op compatible with the given operands

	op := a.findOp(candidates, actualOperands)
	if op == nil {
		return fmt.Errorf("no candidate instruction found for mnemonic %s", ins.Mnemonic)
	}

	//
	// Step 3 - generate instruction

	gi, fix, err := op.Generate(ins.Flags, actualOperands)
	if err != nil {
		return fmt.Errorf("failed to generate instruction (%s)", err)
	}

	log.Printf("GEN: %d", gi)

	if fix != nil {
		fix.SourceSection = a.ActiveSection.Name
		fix.SourceByteOffset = a.ActiveSection.Len()
		a.refs = append(a.refs, fix)
	}

	a.ActiveSection.WriteInstruction(gi)

	return nil
}

func (a *Assembler) findOp(candidates []*opdef, operands []any) *opdef {
	for _, c := range candidates {
		if c.Accepts(operands) {
			return c
		}
	}
	return nil
}

func (a *Assembler) toOBJ(name string) (*ft.Obj, error) {
	out := ft.Obj{
		Name:     name,
		Sections: map[string]*ft.ObjSect{},
		Symbols:  map[ft.Symbol]*ft.ObjSym{},
		Refs:     a.refs,
	}

	for name, sw := range a.sections {
		out.Sections[name] = &ft.ObjSect{
			Name: name,
			Data: sw.Data,
		}
	}

	for name, sym := range a.FileSymbols.Symbols {
		if sym.IsLabel() {
			out.Symbols[name] = &ft.ObjSym{
				Name:    name,
				Section: sym.Section,
				Offset:  sym.Offset,
			}
		}
	}

	return &out, nil
}

func (a *Assembler) eval(expr any) (int64, error) {
	return Eval(a.FileSymbols, expr)
}

func (a *Assembler) exprIsLabel(expr any) (string, bool) {
	if ident, isIdent := expr.(Ident); isIdent {
		if ent, found := a.FileSymbols.Lookup(ft.Symbol(ident)); found {
			if ent.IsLabel() {
				return string(ident), true
			}
		}
	}
	return "", false
}
