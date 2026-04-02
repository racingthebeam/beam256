package linker

import (
	"errors"
	"fmt"
)

func alignVal(n int, align int) int {
	mod := n % align
	if mod == 0 {
		return n
	} else {
		return n + (align - mod)
	}
}

// returns a bitmask for n bits
func bitmask(n int) uint32 {
	return uint32((1<<(n-1) - 1))
}

func relCallBits(delta int) uint32 {
	return uint32((delta - 4) >> 2)
}

// returns the uint32 bit pattern required to represent a relative
// jump of the given byte delta, encoded for inclusion into an
// immediate value.
//
// width is the number of bits available to encode the value.
//
// byteDelta is the number of bytes to jump; this must be a
// multiple of 4. relJmpBits() does not adjust for
// PC state - this must be taken into account by
// the caller.
//
// returns the bit pattern required to encode this jump, or an
// error if the target is out of range. for negative deltas,
// the returned value will be a uint32 representation of a
// negative value, complete with leading 1s.
func relJmpBits(width int, byteDelta int) (uint32, error) {
	if byteDelta&3 != 0 {
		return 0, errors.New("relative jump offset must be a multiple of 4")
	}

	insDelta := byteDelta >> 2

	top := (1 << (width - 1)) - 1
	bot := (-1 << (width - 1))

	if insDelta < bot || insDelta > top {
		return 0, fmt.Errorf("byte delta %d is out of range for a %d bit operand", byteDelta, width)
	}

	return uint32(insDelta), nil
}

func mustFind[E any](v E, ok bool) E {
	if !ok {
		panic("not found")
	}
	return v
}
