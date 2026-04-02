package main

import (
	"fmt"
	"os"

	"github.com/racingthebeam/beam256/toolchain/internal/asm"
	"github.com/racingthebeam/beam256/toolchain/internal/linker"
)

type CmdParse struct {
	Linker CmdParseLinkerScript `cmd:"" name:"linker"`
	ASM    CmdParseASM          `cmd:"" name:"asm"`
}

type CmdParseLinkerScript struct {
	File *os.File `arg:""`
}

func (c *CmdParseLinkerScript) Run() error {
	defer c.File.Close()
	script, err := linker.Parse(c.File.Name(), c.File)
	if err != nil {
		return err
	}

	for _, l := range script.Lines {
		fmt.Println(l.String())
	}

	return nil
}

type CmdParseASM struct {
	File *os.File `arg:""`
}

func (c *CmdParseASM) Run() error {
	defer c.File.Close()

	p, err := asm.NewParser(c.File.Name(), c.File)
	if err != nil {
		return fmt.Errorf("failed to create parser (%s)", err)
	}

	prog, err := p.ParseProgram()
	if err != nil {
		return err
	}

	pp := asm.NewPrinter(os.Stdout, true)
	pp.Print(prog)

	return nil
}
