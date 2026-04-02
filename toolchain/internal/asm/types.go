package asm

import "github.com/racingthebeam/beam256/toolchain/internal/alex"

type Ref struct {
	Filename string
	Pos      alex.Position
}

// CompileOpts represents the active set of compile options
type CompileOpts struct {
}

func (co CompileOpts) Dup() CompileOpts {
	return co
}
