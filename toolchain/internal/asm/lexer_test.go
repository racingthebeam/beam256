package asm

import (
	"testing"

	"github.com/racingthebeam/beam256/toolchain/internal/alex"
	"github.com/stretchr/testify/assert"
)

const IG = "~~~~~~~~~~~~~~~~"

func TestLexer(t *testing.T) {
	const text = `
; this is a comment
.include "foo.inc"
.section foo
foo: bar baz
bleem:
sub.sx 1, $foo, 0xff_12 ; another comment...
def local end

`
	return
	l := Lexer.New(text)

	tok := func(exTok int, exTxt string) {
		tok, err := l.Next()
		assert.Nil(t, err)
		assert.Equal(t, exTok, tok)
		if exTxt != IG {
			assert.Equal(t, exTxt, tok.Text)
		}
	}

	tok(TokNL, IG)
	tok(TokNL, IG)

	tok(TokDotIdent, "include")
	tok(TokString, "foo.inc")
	tok(TokNL, IG)

	tok(TokDotIdent, "section")
	tok(TokIdent, "foo")
	tok(TokNL, IG)

	tok(TokLabel, "foo")
	tok(TokIdent, "bar")
	tok(TokIdent, "baz")
	tok(TokNL, IG)

	tok(TokLabel, "bleem")
	tok(TokNL, IG)

	tok(TokIdent, "sub")
	tok(TokDotIdent, "sx")
	tok(TokInt, "1")
	tok(TokComma, IG)
	tok(TokReg, "foo")
	tok(TokComma, IG)
	tok(TokHex, "0xff_12")
	tok(TokComma, IG)
	tok(TokNL, IG)

	tok(TokDef, IG)
	tok(TokLocal, IG)
	tok(TokEnd, IG)
	tok(TokNL, IG)

	tok(TokNL, IG)

	tok(alex.EOF, IG)
}
