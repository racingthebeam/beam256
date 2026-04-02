package linker

import (
	"fmt"
	"io"

	"github.com/alecthomas/participle/v2"
	"github.com/alecthomas/participle/v2/lexer"
	"github.com/racingthebeam/beam256/toolchain/internal/alex"
)

type Script struct {
	Lines []Line `NL* (@@ NL+)*`
}

type Int struct {
	V int `(@Int | @Hex)`
}

type Line interface {
	String() string
	line()
}

type Org struct {
	Tok    lexer.Token
	Offset Int `"@" @@`
}

func (l Org) String() string { return fmt.Sprintf("@ %d", l.Offset.V) }
func (l Org) line()          {}

type Init struct {
	Tok    lexer.Token
	Ignore int `"i"`
}

func (l Init) String() string { return "i" }
func (l Init) line()          {}

type RelativeJump struct {
	Tok    lexer.Token
	Offset Int `"+" @@`
}

func (l RelativeJump) String() string { return fmt.Sprintf("+ %d", l.Offset.V) }
func (l RelativeJump) line()          {}

type AbsoluteJumpForward struct {
	Tok    lexer.Token
	Offset Int `"j" @@`
}

func (l AbsoluteJumpForward) String() string { return fmt.Sprintf("j %d", l.Offset.V) }
func (l AbsoluteJumpForward) line()          {}

type Reserve struct {
	Tok  lexer.Token
	Size Int `"r" @@`
}

func (l Reserve) String() string { return fmt.Sprintf("r %d", l.Size.V) }
func (l Reserve) line()          {}

type Define struct {
	Tok    lexer.Token
	Symbol string `"d" @Ident`
}

func (l Define) String() string { return fmt.Sprintf("d %s", l.Symbol) }
func (l Define) line()          {}

type Place struct {
	Tok    lexer.Token
	Symbol string `"p" @Ident`
}

func (l Place) String() string { return fmt.Sprintf("p %s", l.Symbol) }
func (l Place) line()          {}

type Align struct {
	Tok       lexer.Token
	Alignment Int `"a" @@`
}

func (l Align) String() string { return fmt.Sprintf("a %d", l.Alignment.V) }
func (l Align) line()          {}

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
		participle.Union[Line](
			&Init{},                // i
			&RelativeJump{},        // +
			&AbsoluteJumpForward{}, // j
			&Reserve{},             // r
			&Org{},                 // @
			&Define{},              // d
			&Place{},               // p
			&Align{},               // a
		),
		participle.CaseInsensitive("Ident"),
	)
)

func Parse(filename string, r io.Reader) (*Script, error) {
	return parser.Parse(filename, alex.NewNLReader(r))
}

func MustParse(filename string, r io.Reader) *Script {
	script, err := Parse(filename, r)
	if err != nil {
		panic(err)
	}
	return script
}
