package asm

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestReg(t *testing.T) {
	assert.True(t, Reg("foo").IsNamed())
	assert.False(t, Reg("12").IsNamed())

	idx, err := Reg("foo").Index()
	assert.Zero(t, idx)
	assert.Error(t, err)

	idx, err = Reg("57").Index()
	assert.Equal(t, 57, idx)
	assert.NoError(t, err)
}
