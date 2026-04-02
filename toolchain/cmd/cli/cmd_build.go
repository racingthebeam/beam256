package main

import (
	"log"
	"os"

	"github.com/racingthebeam/beam256/toolchain/internal/job"
)

type CmdBuild struct {
	OutputFile   string   `name:"out" short:"o" default:"out.gob"`
	LinkerScript string   `name:"linker-script" short:"l"`
	Files        []string `arg:"" optional:"" help:"ASM files to build; if omitted, build all *.asm files."`
}

func (c *CmdBuild) Run() error {
	result, err := job.Build(&job.BuildInput{
		FS:              os.DirFS("."),
		ASMFiles:        c.Files,
		LinkerScript:    c.LinkerScript,
		StringTableSize: 4096,
	})

	if err != nil {
		return err
	}

	log.Printf("result: %+v", result.Image[0:256])
	log.Printf("strings: %+v", result.DebugStringTable)

	// TODO: write the output image

	return nil
}
