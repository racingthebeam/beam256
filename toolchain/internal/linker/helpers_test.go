package linker

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAlign(t *testing.T) {
	input := []int{0, 1, 2, 3, 4, 5, 6, 7, 8, 10}
	output := []int{0, 4, 4, 4, 4, 8, 8, 8, 8, 12}
	for i := range input {
		assert.Equal(t, output[i], alignVal(input[i], 4))
	}
}

func TestRelCallBits(t *testing.T) {
	input := []int{
		4,
		8,
		20,

		0,
		-4,
		-16,
	}

	output := []uint32{
		0,
		1,
		4,

		0xFF_FF_FF_FF,
		0xFF_FF_FF_FE,
		0xFF_FF_FF_FB,
	}

	for i := range input {
		assert.Equal(t, output[i], relCallBits(input[i]))
	}
}

func TestRelJmpBits(t *testing.T) {
	cases := []struct {
		W   int
		D   int
		O   uint32
		Err bool
	}{
		// simple forward jump
		{8, 4, 0x00000001, false},

		// simple backward jumps
		{8, -4, 0xFFFFFFFF, false},
		{8, -16, 0xFFFFFFFC, false},

		// 508 = (127 * 4) => max allowed fwd jump
		{8, 508, 0x0000007F, false},

		// 512 => out of range, error
		{8, 512, 0, true},

		// -512 = (-128 * 4) => max allowed backwards jump
		{8, -512, 0xFFFFFF80, false},

		// -516 => out of range, error
		{8, -516, 0, true},
	}

	for _, c := range cases {
		res, err := relJmpBits(c.W, c.D)
		if c.Err {
			assert.Error(t, err)
		} else {
			assert.NoError(t, err)
			assert.Equal(t, c.O, res)
		}
	}
}
