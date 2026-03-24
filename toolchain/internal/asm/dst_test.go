package asm

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestStringTable(t *testing.T) {
	dst := NewDebugStringTable(2048)

	i0, _ := dst.Add("hello")
	assert.Equal(t, i0, 1)

	i1, _ := dst.Add("is there anybody out there?")
	assert.Equal(t, i1, 2)

	st := dst.Render()

	assert.Equal(t, []byte{
		6, 0,
		8, 0,
		14, 0,
		'!', 0,
		'h', 'e', 'l', 'l', 'o', 0,
		'i', 's', ' ', 't', 'h', 'e', 'r', 'e', ' ', 'a', 'n', 'y', 'b', 'o', 'd', 'y', ' ', 'o', 'u', 't', ' ', 't', 'h', 'e', 'r', 'e', '?', 0,
	}, st)
}
