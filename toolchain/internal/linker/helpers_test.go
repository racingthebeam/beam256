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
