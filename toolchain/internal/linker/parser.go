package linker

import (
	"io"

	"github.com/alecthomas/participle/v2"
	"github.com/alecthomas/participle/v2/lexer"
)

type Script struct {
	Lines []Line `NL* @@ (NL+ @@)* NL*`
}

type Int struct {
	V int `(@Int | @Hex)`
}

type Line interface{ line() }

type Org struct {
	Offset Int `"@" @@`
}

func (l Org) line() {}

type Jump struct {
	Offset Int `"+" @@`
}

func (l Jump) line() {}

type Reserve struct {
	Size Int `"r" @@`
}

func (l Reserve) line() {}

type Define struct {
	Symbol string `"d" @Ident`
}

func (l Define) line() {}

type Place struct {
	Symbol string `"p" @Ident`
}

func (l Place) line() {}

type Align struct {
	Alignment Int `"a" @@`
}

func (l Align) line() {}

var (
	lex = lexer.MustSimple([]lexer.SimpleRule{
		{"At", `@`},
		{"Plus", `\+`},
		{"Ident", `[a-zA-Z_][a-zA-Z0-9_]*`},
		{"Hex", `0x[0-9a-fA-F]+`},
		{"Int", `[0-9]+`},
		{"NL", `(\n|\r\n?)`},

		{"comment", `;[^\n]*`},
		{"whitespace", `[ \t]+`},
	})

	parser = participle.MustBuild[Script](
		participle.Lexer(lex),
		participle.Union[Line](&Jump{}, &Reserve{}, &Org{}, &Define{}, &Place{}, &Align{}),
		participle.CaseInsensitive("Ident"),
	)
)

func Parse(filename string, r io.Reader) (*Script, error) {
	return parser.Parse(filename, r)
}
