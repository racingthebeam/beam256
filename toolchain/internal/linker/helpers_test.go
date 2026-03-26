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
