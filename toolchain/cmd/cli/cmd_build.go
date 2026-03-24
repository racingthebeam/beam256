package main

import (
	"fmt"
	"log"
	"os"

	"github.com/racingthebeam/beam256/toolchain/internal/job"
)

type CmdBuild struct {
	OutputFile   string   `name:"out" short:"o" default:"out.gob"`
	LinkerScript string   `name:"linker-script" short:"l" default:"linker.lnk"`
	Files        []string `arg:"" optional:"" help:"ASM files to build; if omitted, build all *.asm files."`
}

func (c *CmdBuild) Run() error {
	result, err := job.Build(&job.Input{
		FS:           os.DirFS("."),
		ASMFiles:     c.Files,
		LinkerScript: c.LinkerScript,
	})

	if err != nil {
		return err
	}

	log.Printf("result: %+v", result)

	// TODO: write the output image

	return fmt.Errorf("not implemented")
}
