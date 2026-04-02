package asm

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestResolveRelativeFilename(t *testing.T) {
	type testCase struct {
		I, O string
	}

	cases := []testCase{
		{"a/b/c.asm", "a/b/c.asm"},
		{"/a/b/c.asm", "a/b/c.asm"},

		{"./library.inc", "foo/bar/library.inc"},
		{"./chicken/library.inc", "foo/bar/chicken/library.inc"},
		{"../library.inc", "foo/library.inc"},
		{"../moose/library.inc", "foo/moose/library.inc"},
	}

	for _, c := range cases {
		assert.Equal(t, c.O, resolveFilename("foo/bar/main.asm", c.I))
	}
}
