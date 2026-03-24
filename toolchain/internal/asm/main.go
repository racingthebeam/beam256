package asm

import (
	"errors"
	"io/fs"

	"github.com/racingthebeam/beam256/toolchain/internal/ft"
)

type Opts struct {
	FS      fs.FS
	Strings *DebugStringTable

	// Debug build
	// If true, PRINT, DUMP, and HALT.B statements will remain
	// in the output. Otherwise, they're stripped.
	Debug bool
}

type Assembler struct {
	Opts
}

func New(opts *Opts) *Assembler {
	return &Assembler{
		Opts: *opts,
	}
}

func (a *Assembler) Assemble(filename string) (*ft.Obj, error) {
	fh, err := a.FS.Open(filename)
	if err != nil {
		return nil, err
	}

	defer fh.Close()

	return nil, errors.New("not implemented")
}
