package asm

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFlags(t *testing.T) {
	fs := NewFlagSet("abc", 6)

	enc, err := fs.Encode("ab")
	assert.NoError(t, err)
	assert.Equal(t, int64(0b110000), enc)

	enc, err = fs.Encode("a")
	assert.NoError(t, err)
	assert.Equal(t, int64(0b100000), enc)

	enc, err = fs.Encode("c")
	assert.NoError(t, err)
	assert.Equal(t, int64(0b001000), enc)

	enc, err = fs.Encode("d")
	assert.Error(t, err)
}
