package main

import (
	"fmt"
	"os"

	"github.com/augustoroman/hexdump"
	"github.com/racingthebeam/beam256/toolchain/internal/asm"
)

type CmdAssemble struct {
	OutputFile string `name:"out" short:"o" default:"out.gob"`
	File       string `arg:"" help:"ASM file to build."`
	Debug      bool   `name:"debug" help:"Enable debug build (print, dump, etc)."`
}

func (c *CmdAssemble) Run() error {
	dst := asm.NewDebugStringTable(4096)

	asm := asm.New(&asm.Opts{
		FS:               os.DirFS("."),
		DebugStringTable: dst,
		Debug:            c.Debug,
	})

	obj, err := asm.Assemble(c.File)
	if err != nil {
		return err
	}

	for sn, sec := range obj.Sections {
		fmt.Printf("SECTION %s (length=%d)\n", sn, len(sec.Data))
		fmt.Println(hexdump.Dump(sec.Data))
	}

	fmt.Printf("SYMBOL TABLE\n")
	for k, v := range obj.Symbols {
		fmt.Printf("%s: %s@%d\n", k, v.Section, v.Offset)
	}

	return nil
}
