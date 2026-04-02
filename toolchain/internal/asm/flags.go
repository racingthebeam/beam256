package asm

import (
	"fmt"
	"strings"
)

type FlagSet struct {
	Width int

	flags string
	locs  map[byte]int
}

func NewFlagSet(flags string, width int) *FlagSet {
	ls := map[byte]int{}
	for i := range flags {
		ls[flags[i]] = (width - i - 1)
	}

	return &FlagSet{
		Width: width,

		flags: flags,
		locs:  ls,
	}
}

func (fs *FlagSet) Encode(flags string) (uint32, error) {
	out := uint32(0)

	flags = strings.ToLower(flags)
	for i := range flags {
		loc, ok := fs.locs[flags[i]]
		if !ok {
			return 0, fmt.Errorf("unknown flag '%c' encountered in flagset %s", flags[i], fs.flags)
		}
		out |= (1 << loc)
	}

	return out, nil
}
