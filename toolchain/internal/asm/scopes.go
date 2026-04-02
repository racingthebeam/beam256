package asm

import (
	"errors"
	"fmt"

	"github.com/racingthebeam/beam256/toolchain/internal/ft"
)

type Scope interface {
	Include(file string) error
	Section(section string) error
	ResolveNamedReg(r NamedReg) (NumReg, error)
	Label(sym ft.Symbol) error
	FnDef(def *FnDef) error
}

//
//

type RootScope struct {
	A *Assembler
}

var _ Scope = &RootScope{}

func (s *RootScope) Include(file string) error {
	absPath := s.A.Files.ResolvePath(file)

	s.A.Files.Push(absPath)
	defer s.A.Files.Pop()

	prog, err := s.A.ReadAndParse(absPath)
	if err != nil {
		return err
	} else if err := s.A.AssembleStatements(prog.Statements); err != nil {
		return err
	}

	return nil
}

func (s *RootScope) Section(section string) error {
	s.A.SetSection(section)
	return nil
}

func (s *RootScope) ResolveNamedReg(r NamedReg) (NumReg, error) {
	return 0, errors.New("named registers are not supported at the root scope")
}

func (s *RootScope) Label(sym ft.Symbol) error {
	if !s.A.FileSymbols.AddLabel(Ref{}, sym, s.A.ActiveSection.Name, len(s.A.ActiveSection.Data)) {
		return fmt.Errorf("duplicate symbol %q", sym)
	}
	return nil
}

func (s *RootScope) FnDef(def *FnDef) error {
	fnScope := &FnScope{
		A:           s.A,
		Locals:      map[string]int{},
		NextScratch: 0,
	}

	s.A.Scope = fnScope
	defer func() { s.A.Scope = s }()

	if err := s.Label(ft.Symbol(def.Name)); err != nil {
		return fmt.Errorf("invalid function name - duplicate symbol %q", def.Name)
	}

	// First instruction in any function call is RSV, to reserve
	// stack space for arguments and locals. We won't know how
	// many slots to reserve until the function has been assembled
	// (because of potential scratch register usage), so plant a
	// dummy instruction to be patched afterwards.
	rsvOffset := s.A.ActiveSection.Len()
	s.A.ActiveSection.WriteInstruction(0)

	for i, r := range def.Params {
		if _, err := fnScope.PutLocal(string(r)); err != nil {
			return fmt.Errorf("function parameter %d: %w", i, err)
		}
	}

	for i, l := range def.Locals {
		if _, err := fnScope.PutLocal(string(l)); err != nil {
			return fmt.Errorf("function local %d: %w", i, err)
		}
	}

	if err := s.A.AssembleStatements(def.Body); err != nil {
		return err
	}

	// TODO: generate real RSV instruction
	s.A.ActiveSection.PatchInstruction(rsvOffset, 0)

	return nil
}

//
//

type FnScope struct {
	A           *Assembler
	Locals      map[string]int
	NextScratch int
}

var _ Scope = &FnScope{}

func (s *FnScope) PutLocal(name string) (int, error) {
	if len(s.Locals) == 64 {
		return 0, errors.New("register space exhausted")
	}

	_, exists := s.Locals[name]
	if exists {
		return 0, fmt.Errorf("duplicate local %q", name)
	}

	ix := len(s.Locals)
	s.Locals[name] = ix

	return ix, nil
}

func (s *FnScope) GenerateScratchLocal() (string, int, error) {
	for {
		candidate := fmt.Sprintf("scratch%d", s.NextScratch)
		s.NextScratch++
		_, exists := s.Locals[candidate]
		if exists {
			continue
		}
		ix, err := s.PutLocal(candidate)
		if err != nil {
			return "", 0, err
		}
		return candidate, ix, nil
	}
}

func (s *FnScope) Include(file string) error {
	return errors.New(".include is not allowed inside function definitions")
}

func (s *FnScope) Section(section string) error {
	return errors.New(".section is not allowed inside function definitions")
}

func (s *FnScope) ResolveNamedReg(r NamedReg) (NumReg, error) {
	idx, found := s.Locals[string(r)]
	if !found {
		return 0, fmt.Errorf("undefined local register @%s", r)
	}
	return NumReg(idx), nil
}

func (s *FnScope) Label(sym ft.Symbol) error {
	// global labels are not permitted within function definitions
	// this is a weak attempt to prevent silly things like cross-function jumps
	// if you want that brand of crazy, you're on your own...
	if sym.IsPublic() {
		return errors.New("global labels are not allowed inside function definitions")
	}

	if !s.A.FileSymbols.AddLabel(Ref{}, sym, s.A.ActiveSection.Name, s.A.ActiveSection.Len()) {
		return fmt.Errorf("duplicate function label %q", string(sym))
	}

	return nil
}

func (s *FnScope) FnDef(def *FnDef) error {
	return errors.New("nested functions are not allowed")
}
