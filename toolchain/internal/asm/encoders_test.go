package asm

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestEncoders(t *testing.T) {
	enc1 := encoder{
		ce(FLAGS, 8, 24),
		ce(O0, 12, 4),
	}

	result := enc1.Encode(0b1111_1111_1010_1010, []uint32{
		0b1111_0101_0101_0101,
	})

	assert.Equal(t, result, uint32(0b1010_1010_0000_0000_0101_0101_0101_0000))
}
