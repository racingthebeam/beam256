package job

import (
	"fmt"
	"io/fs"

	"github.com/racingthebeam/beam256/toolchain/internal/asm"
	"github.com/racingthebeam/beam256/toolchain/internal/ft"
	"github.com/racingthebeam/beam256/toolchain/internal/linker"
)

type BuildInput struct {
	// Filesystem containing:
	// 1) .asm files, containing code/data
	// 2) include files
	// 3) linker script
	FS fs.FS

	// List of ASM files to compile
	// If nil, glob *.asm
	ASMFiles []string

	// Filename for linker script
	LinkerScript string

	StringTableSize int
}

func Build(input *BuildInput) (*ft.Goblin, error) {
	dst := asm.NewDebugStringTable(input.StringTableSize)
	objs := make([]*ft.Obj, 0)

	files := input.ASMFiles
	if len(files) == 0 {
		fs, err := fs.Glob(input.FS, "*.asm")
		if err != nil {
			return nil, fmt.Errorf("failed to glob for source files (%s)", err)
		}
		if len(fs) == 0 {
			return nil, fmt.Errorf("no input files")
		}
		files = fs
	}

	for _, filename := range files {
		obj, err := asm.New(&asm.Opts{
			FS:               input.FS,
			Debug:            true,
			DebugStringTable: dst,
		}).Assemble(filename)
		if err != nil {
			return nil, fmt.Errorf("assemble %q failed: %s", filename, err)
		}
		objs = append(objs, obj)
	}

	var linkerScript *linker.Script
	if input.LinkerScript == "" {
		linkerScript = linker.Default()
	} else {
		lh, err := input.FS.Open(input.LinkerScript)
		if err != nil {
			return nil, fmt.Errorf("failed to open linker script %q: %s", input.LinkerScript, err)
		}

		defer lh.Close()

		ls, err := linker.Parse(input.LinkerScript, lh)
		if err != nil {
			return nil, fmt.Errorf("failed to parse linker script %q: %s", input.LinkerScript, err)
		}

		linkerScript = ls
	}

	img, err := linker.New(&linker.Opts{
		MemorySize:    256 * 1024,
		AddressBits:   18,
		Script:        linkerScript,
		InitGenerator: nil,
		Objects:       objs,
	}).Link()

	if err != nil {
		return nil, fmt.Errorf("linking failed: %s", err)
	}

	return &ft.Goblin{
		Image:            img.Image,
		DebugStringTable: dst.Render(),
	}, nil
}
