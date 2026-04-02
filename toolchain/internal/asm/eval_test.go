package asm

import (
	"bytes"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestExpressionEval(t *testing.T) {
	syms := NewSymbolTable()
	syms.AddDef(Ref{}, "a", 100)
	syms.AddDef(Ref{}, "b", 200)
	syms.AddDef(Ref{}, "c", -100)
	syms.AddLabel(Ref{}, "loop", "main", 0)

	type testCase struct {
		Expr   string
		Result int64
	}

	var cases = []testCase{
		{"1+2", 3},
		{"1+2*3", 7},
		{"(1+-2)*3", -3},
		{"8 >> 2", 2},
		{"-1", -1},
		{"-2 >>> 1", -1},
		{"-1 >>> 1", -1},
		{"a + b", 300},
		{"(b / a) + a", 102},
		{"b / a + a", 102},
		{"+c", -100},
		{"0b1100 | 0b0111", 0b1111},
		{"0b1100 ^ 0b1010", 0b0110},
		{"2 ** 4", 16},
		{"100 % 6", 4},

		{"@min(1, 2, 3)", 1},
		{"@max(10, 105, (10 + a))", 110},
		{"@abs(-1)", 1},
		{"@abs(100)", 100},
		{"@sign(-100)", -1},
		{"@sign(0)", 0},
		{"@sign(100)", 1},
		{"@ctz(0b100)", 2},
		{"@clz(0b100)", 61},
		{"@bitcount(0b1101110011101)", 9},
		{"@rol(0x4000_0000_0000_0000, 2)", 1},
		{"@ror(0x0000_0000_0000_0001, 2)", 0x4000_0000_0000_0000},
	}

	for _, c := range cases {
		p, _ := NewParser("test.asm", bytes.NewReader([]byte(c.Expr)))
		expr, err := p.ParseExpression()
		if err != nil {
			panic(err)
		}
		res, err := Eval(syms, expr)
		assert.NoError(t, err)
		assert.Equal(t, c.Result, res)
	}
}
