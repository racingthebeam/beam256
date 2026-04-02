package asm

import (
	"fmt"
	"strconv"
	"unicode"
)

type Program struct {
	Statements []any
}

//
// Directive

type DirInclude struct{ Filename string }
type DirSection struct{ Name string }
type DirAlign struct{ Alignment int }
type DirZeroes struct{ Count any }

type DirDefine struct {
	Ident Ident
	Value any
}

type DirUndefine struct {
	Ident Ident
}

type DirWords struct{ Values []any }
type DirHalfWords struct{ Values []any }
type DirBytes struct{ Values []any }

type DirPushOpt struct{}
type DirSetOpt struct {
	Key   string
	Value any
}
type DirPopOpt struct{}

//
// Function definition

type FnDef struct {
	Name   string
	Params []Reg
	Locals []Reg
	Body   []any
}

//
// Label

type Label string

//
// Instruction

type Instruction struct {
	Mnemonic string
	Flags    string
	Operands []any
}

//
// Print

type Print struct {
	String   string
	Operands []any
}

//
// Expression

type Op int

func (o Op) String() string { return operatorText[o] }

const (
	Add = Op(iota + 1)
	Sub
	Mul
	Div
	LSL
	LSR
	ASR
	Pow
	Mod
	And
	Or
	Xor

	Not
	Neg
	Pos
)

var operatorText = []string{
	"",
	"+",
	"-",
	"*",
	"/",
	"<<",
	">>",
	">>>",
	"**",
	"%",
	"&",
	"|",
	"^",

	"~",
	"-",
}

type BinOpExp struct {
	Op          Op
	Left, Right any
}

type UnOpExp struct {
	Op  Op
	Exp any
}

type Call struct {
	Fn   any
	Args []any
}

type AutoScratchExp struct {
	Exp any
}

//
//

type Reg string

func (r Reg) IsNamed() bool {
	return !unicode.IsDigit(rune(r[0]))
}

func (r Reg) Index() (int, error) {
	if r.IsNamed() {
		return 0, fmt.Errorf("register $%s is not numeric", r)
	}
	return strconv.Atoi(string(r))
}

type Ident string
type AtIdent string

type Number interface{ NumVal() int64 }

type Int int64

func (i Int) NumVal() int64 { return int64(i) }

type Hex int64

func (h Hex) NumVal() int64 { return int64(h) }

type Bin int64

func (b Bin) NumVal() int64 { return int64(b) }
