package asm

import (
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/racingthebeam/beam256/toolchain/internal/alex"
	"github.com/racingthebeam/beam256/toolchain/internal/ft"
	"github.com/twmb/murmur3"
)

// Precedence classes
const (
	PrecSum    = 3
	PrecMul    = 4
	PrecExp    = 5
	PrecBit    = 6
	PrecPrefix = 7
	PrecCall   = 8
)

type Parser struct {
	alex.Parser

	prefix map[int]PrefixParselet
	infix  map[int]InfixParselet
	fnName string
}

func NewParser(filename string, r io.Reader) (*Parser, error) {
	text, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}

	text = append(text, '\n')

	lex := Lexer.New(string(text))

	p := &Parser{
		Parser: *alex.NewParser(lex),
	}

	p.prefix = map[int]PrefixParselet{
		TokTilde:  &UnaryOpParselet{Prec: PrecPrefix},
		TokMinus:  &UnaryOpParselet{Prec: PrecPrefix},
		TokPlus:   &UnaryOpParselet{Prec: PrecPrefix},
		TokLParen: &GroupParselet{},
		TokLBrace: &AutoScratchParselet{},

		TokNamedReg: &AtomParselet{},
		TokNumReg:   &AtomParselet{},
		TokIdent:    &AtomParselet{},
		TokAtIdent:  &AtomParselet{},
		TokInt:      &AtomParselet{},
		TokHex:      &AtomParselet{},
		TokBin:      &AtomParselet{},
		TokString:   &AtomParselet{},
	}

	p.infix = map[int]InfixParselet{
		TokLParen:      &CallParselet{},
		TokPlus:        &BinOpParselet{Prec: PrecSum, IsRight: false},
		TokMinus:       &BinOpParselet{Prec: PrecSum, IsRight: false},
		TokStarStar:    &BinOpParselet{Prec: PrecExp, IsRight: false},
		TokStar:        &BinOpParselet{Prec: PrecMul, IsRight: false},
		TokSlash:       &BinOpParselet{Prec: PrecMul, IsRight: false},
		TokPercent:     &BinOpParselet{Prec: PrecMul, IsRight: false},
		TokHat:         &BinOpParselet{Prec: PrecBit, IsRight: false},
		TokAmp:         &BinOpParselet{Prec: PrecBit, IsRight: false},
		TokPipe:        &BinOpParselet{Prec: PrecBit, IsRight: false},
		TokArrowRight3: &BinOpParselet{Prec: PrecBit, IsRight: false},
		TokArrowRight2: &BinOpParselet{Prec: PrecBit, IsRight: false},
		TokArrowLeft2:  &BinOpParselet{Prec: PrecBit, IsRight: false},
	}

	return p, nil
}

func (p *Parser) ParseProgram() (*Program, error) {
	if err := p.Start(); err != nil {
		return nil, err
	}

	// skip leading newlines
	for p.At(TokNL) {
		p.Adv()
	}

	var err error
	out := Program{}

	for !p.At(alex.EOF) {
		out.Statements, err = p.parseLineStatements(out.Statements)
		if err != nil {
			return nil, err
		}
	}

	return &out, nil
}

// ParseExpression is a parsing entry point for parsing input text
// containing only a single expression, intended for use in tests.
func (p *Parser) ParseExpression() (any, error) {
	if err := p.Start(); err != nil {
		return nil, err
	}

	exp, err := p.parseExpression()
	if err != nil {
		return nil, err
	}

	for p.At(TokNL) {
		p.Adv()
	}

	if _, err := p.Accept(alex.EOF); err != nil {
		return nil, err
	}

	return exp, nil
}

func (p *Parser) parseLineStatements(dst []any) ([]any, error) {
	switch p.Curr().Type {
	case TokDotIdent:
		dir, err := p.parseDirectiveLine()
		if err != nil {
			return nil, err
		}
		return append(dst, dir), nil
	case TokDef:
		if p.inFunction() {
			return nil, errors.New("nested functions are not allowed")
		}
		def, err := p.parseFnDef()
		if err != nil {
			return nil, err
		}
		return append(dst, def), nil
	}

	if p.At(TokLabel) {
		labelName := p.mangle(p.Adv().Text)

		dst = append(dst, Label(labelName))
		if p.At(TokNL) {
			p.endLine()
			return dst, nil
		}
	}

	var out any
	var err error

	if p.At(TokIdent) && strings.ToLower(p.Curr().Text) == "print" {
		out, err = p.parsePrint()
	} else {
		out, err = p.parseInstruction()
	}

	if err != nil {
		return nil, err
	}

	return append(dst, out), nil
}

func (p *Parser) parseInstruction() (*Instruction, error) {
	ins := Instruction{}

	tok, err := p.Accept(TokIdent)
	if err != nil {
		return nil, err
	}

	ins.Mnemonic = strings.ToLower(tok.Text)

	if p.At(TokDotIdent) {
		ins.Flags = p.Adv().Text
	}

	if !p.At(TokNL) {
		op, err := p.parseOperand()
		if err != nil {
			return nil, err
		}
		ins.Operands = append(ins.Operands, op)
		for p.At(TokComma) {
			p.Adv()
			op, err := p.parseOperand()
			if err != nil {
				return nil, err
			}
			ins.Operands = append(ins.Operands, op)
		}
	}

	if err := p.endLine(); err != nil {
		return nil, err
	}

	return &ins, nil
}

func (p *Parser) parsePrint() (*Print, error) {
	p.Adv()

	tok, err := p.Accept(TokString)
	if err != nil {
		return nil, err
	}

	out := &Print{String: tok.Text}

	for p.At(TokComma) {
		p.Adv()
		op, err := p.parseOperand()
		if err != nil {
			return nil, err
		}
		out.Operands = append(out.Operands, op)
	}

	if err := p.endLine(); err != nil {
		return nil, err
	}

	return out, nil
}

func (p *Parser) parseOperand() (any, error) {
	return p.parseExpression()
}

func (p *Parser) parseDirectiveLine() (any, error) {
	directive := p.Adv().Text

	switch directive {
	case "include":
		if filename, err := p.acceptEnd(TokString); err != nil {
			return nil, err
		} else {
			return &DirInclude{Filename: filename}, nil
		}
	case "define":
		if name, err := p.Accept(TokIdent); err != nil {
			return nil, err
		} else if expr, err := p.parseExpression(); err != nil {
			return nil, err
		} else if err := p.endLine(); err != nil {
			return nil, err
		} else {
			return &DirDefine{Ident: Ident(name.Text), Value: expr}, nil
		}
	case "undef":
		if name, err := p.Accept(TokIdent); err != nil {
			return nil, err
		} else if err := p.endLine(); err != nil {
			return nil, err
		} else {
			return &DirUndefine{Ident: Ident(name.Text)}, nil
		}
	case "align":
		if align, err := p.parseLiteralUint(); err != nil {
			return nil, err
		} else if err := p.endLine(); err != nil {
			return nil, err
		} else {
			return &DirAlign{Alignment: int(align)}, nil
		}
	case "section":
		if section, err := p.acceptEnd(TokIdent); err != nil {
			return nil, err
		} else {
			return &DirSection{Name: section}, nil
		}
	case "z":
		if count, err := p.parseExpression(); err != nil {
			return nil, err
		} else if err := p.endLine(); err != nil {
			return nil, err
		} else {
			return &DirZeroes{Count: count}, nil
		}
	case "w":
		if data, err := p.parseData(); err != nil {
			return nil, err
		} else if err := p.endLine(); err != nil {
			return nil, err
		} else {
			return &DirWords{Values: data}, nil
		}
	case "h":
		if data, err := p.parseData(); err != nil {
			return nil, err
		} else if err := p.endLine(); err != nil {
			return nil, err
		} else {
			return &DirHalfWords{Values: data}, nil
		}
	case "b":
		if data, err := p.parseData(); err != nil {
			return nil, err
		} else if err := p.endLine(); err != nil {
			return nil, err
		} else {
			return &DirBytes{Values: data}, nil
		}
	case "pushopt":
		if err := p.endLine(); err != nil {
			return nil, err
		}
		return &DirPushOpt{}, nil
	case "setopt":
		if key, err := p.Accept(TokIdent); err != nil {
			return nil, err
		} else if val, err := p.parseOptValue(); err != nil {
			return nil, err
		} else if err := p.endLine(); err != nil {
			return nil, err
		} else {
			return &DirSetOpt{Key: key.Text, Value: val}, nil
		}
	case "popopt":
		if err := p.endLine(); err != nil {
			return nil, err
		}
		return &DirPopOpt{}, nil
	default:
		return nil, fmt.Errorf("unknown directive %q", directive)
	}
}

func (p *Parser) parseData() ([]any, error) {
	expr, err := p.parseExpression()
	if err != nil {
		return nil, err
	}
	out := []any{expr}
	for p.At(TokComma) {
		p.Adv()
		expr, err := p.parseExpression()
		if err != nil {
			return nil, err
		}
		out = append(out, expr)
	}
	return out, nil
}

func (p *Parser) parseFnDef() (*FnDef, error) {
	p.Adv()

	name, err := p.Accept(TokIdent)
	if err != nil {
		return nil, err
	} else if _, err := p.Accept(TokLParen); err != nil {
		return nil, err
	}

	p.fnName = name.Text
	defer func() { p.fnName = "" }()

	params := []NamedReg{}
	if p.At(TokNamedReg) {
		for {
			params = append(params, NamedReg(p.Adv().Text))
			if p.At(TokComma) {
				p.Adv()
			} else {
				break
			}
		}
	}

	if _, err := p.Accept(TokRParen); err != nil {
		return nil, err
	} else if err := p.endLine(); err != nil {
		return nil, err
	}

	locals := []NamedReg{}
	for p.At(TokLocal) {
		p.Adv()
		if !p.At(TokNamedReg) {
			return nil, fmt.Errorf("expected REG")
		}

		for p.At(TokNamedReg) {
			locals = append(locals, NamedReg(p.Adv().Text))
			if p.At(TokComma) {
				p.Adv()
			} else {
				break
			}
		}

		if err := p.endLine(); err != nil {
			return nil, err
		}
	}

	body, err := p.parseFnBody()
	if err != nil {
		return nil, err
	}

	if _, err := p.Accept(TokEnd); err != nil {
		return nil, err
	} else if err := p.endLine(); err != nil {
		return nil, err
	}

	out := FnDef{
		Name:   name.Text,
		Params: params,
		Locals: locals,
		Body:   body,
	}

	return &out, nil
}

func (p *Parser) parseFnBody() ([]any, error) {
	body := []any{}
	var err error

	for !p.At(TokEnd) {
		body, err = p.parseLineStatements(body)
		if err != nil {
			return nil, err
		}
	}

	return body, nil
}

func (p *Parser) parseOptValue() (any, error) {
	if p.At(TokIdent) {
		return Ident(p.Adv().Text), nil
	} else if p.At(TokString) {
		return p.Adv().Text, nil
	} else if p.At(TokInt) || p.At(TokHex) || p.At(TokBin) {
		return p.parseNumber()
	} else {
		return nil, errors.New("failed to parse opt value, expected string, ident, or number")
	}
}

func (p *Parser) parseExpression() (any, error) {
	exp, err := p.parseExpr(0)
	if err != nil {
		return nil, err
	}

	if ident, ok := exp.(Ident); ok {
		return Ident(p.mangle(string(ident))), nil
	}

	return exp, nil
}

func (p *Parser) parseExpr(prec int) (any, error) {
	tok := p.Adv()

	prefix, ok := p.prefix[tok.Type]
	if !ok {
		return nil, errors.New("expected expression")
	}

	left, err := prefix.Parse(p, tok)
	if err != nil {
		return nil, err
	}

	for prec < p.precedence() {
		tok := p.Adv()

		infix := p.infix[tok.Type]
		left, err = infix.Parse(p, left, tok)
		if err != nil {
			return nil, err
		}
	}

	return left, nil
}

func (p *Parser) precedence() int {
	infix := p.infix[p.Curr().Type]
	if infix == nil {
		return 0
	}
	return infix.Precedence()
}

func (p *Parser) parseLiteralUint() (int64, error) {
	num, err := p.parseNumber()
	if err != nil {
		return 0, err
	}

	return num.NumVal(), nil
}

func (p *Parser) parseNumber() (Number, error) {
	var val int64
	var err error

	if p.At(TokInt) || p.At(TokHex) || p.At(TokBin) {
		val, err = strconv.ParseInt(p.Curr().Text, 0, 64)
	} else {
		err = errors.New("failed to parse int token!")
	}

	if err != nil {
		return nil, err
	}

	var out Number

	if p.At(TokInt) {
		out = Int(val)
	} else if p.At(TokHex) {
		out = Hex(val)
	} else if p.At(TokBin) {
		out = Bin(val)
	}

	p.Adv()

	return out, err
}

func (p *Parser) acceptEnd(tok int) (string, error) {
	if tok, err := p.Accept(tok); err != nil {
		return "", err
	} else if err := p.endLine(); err != nil {
		return "", err
	} else {
		return tok.Text, nil
	}
}

func (p *Parser) endLine() error {
	if !p.At(TokNL) {
		return errors.New("expected NL")
	}
	for p.At(TokNL) {
		p.Adv()
	}
	return nil
}

func (p *Parser) parseAtomFrom(tok alex.Token) (any, error) {
	switch tok.Type {
	case TokInt, TokHex, TokBin:
		return p.parseNumberFrom(tok)
	case TokIdent:
		return Ident(tok.Text), nil
	case TokAtIdent:
		return AtIdent(tok.Text), nil
	case TokString:
		return tok.Text, nil
	case TokNamedReg:
		return NamedReg(tok.Text), nil
	case TokNumReg:
		idx, _ := strconv.Atoi(tok.Text)
		return NumReg(idx), nil
	default:
		return nil, errors.New("unexpected token")
	}
}

func (p *Parser) parseNumberFrom(tok alex.Token) (Number, error) {
	var val int64
	var err error

	if tok.Type == TokInt || tok.Type == TokHex || tok.Type == TokBin {
		val, err = strconv.ParseInt(tok.Text, 0, 64)
	} else {
		err = errors.New("failed to parse int token!")
	}

	if err != nil {
		return nil, err
	}

	var out Number

	switch tok.Type {
	case TokInt:
		out = Int(val)
	case TokHex:
		out = Hex(val)
	case TokBin:
		out = Bin(val)
	}

	return out, err
}

func (p *Parser) isExprAtom(tok alex.Token) bool {
	return tok.Type == TokHex ||
		tok.Type == TokBin ||
		tok.Type == TokInt ||
		tok.Type == TokString ||
		tok.Type == TokIdent ||
		tok.Type == TokAtIdent ||
		tok.Type == TokNamedReg ||
		tok.Type == TokNumReg
}

func (p *Parser) inFunction() bool { return len(p.fnName) > 0 }

func (p *Parser) mangle(text string) string {
	if p.inFunction() && ft.Symbol(text).IsPrivate() {
		// _foo -> __my_function_XXXXX_foo
		hash := uint64(murmur3.StringSum32(p.fnName + "/" + text))
		return fmt.Sprintf("__%s_%s_%s", p.fnName, strconv.FormatUint(hash, 36), text[1:])
	}
	return text
}

//
//

type PrefixParselet interface {
	Parse(p *Parser, tok alex.Token) (any, error)
}

type InfixParselet interface {
	Parse(p *Parser, left any, tok alex.Token) (any, error)
	Precedence() int
}

//
//

type NameParselet struct{}

func (np *NameParselet) Parse(p *Parser, tok alex.Token) (any, error) {
	switch tok.Type {
	case TokIdent:
		return Ident(tok.Text), nil
	case TokAtIdent:
		return AtIdent(tok.Text), nil
	default:
		return nil, errors.New("expected Ident or AtIdent")
	}
}

type AtomParselet struct{}

func (ap *AtomParselet) Parse(p *Parser, tok alex.Token) (any, error) {
	if !p.isExprAtom(tok) {
		return nil, errors.New("expected atom")
	}
	return p.parseAtomFrom(tok)
}

var unaryOpTokens = map[int]Op{
	TokTilde: Not,
	TokMinus: Neg,
	TokPlus:  Pos,
}

type UnaryOpParselet struct {
	Prec int
}

func (pop *UnaryOpParselet) Parse(p *Parser, tok alex.Token) (any, error) {
	right, err := p.parseExpr(pop.Prec)
	if err != nil {
		return nil, err
	}

	return &UnOpExp{Op: unaryOpTokens[tok.Type], Exp: right}, nil
}

//
//

type GroupParselet struct{}

func (gp *GroupParselet) Parse(p *Parser, tok alex.Token) (any, error) {
	if inner, err := p.parseExpression(); err != nil {
		return nil, err
	} else if _, err := p.Accept(TokRParen); err != nil {
		return nil, err
	} else {
		return inner, nil
	}
}

//
//

type AutoScratchParselet struct{}

func (gp *AutoScratchParselet) Parse(p *Parser, tok alex.Token) (any, error) {
	if inner, err := p.parseExpression(); err != nil {
		return nil, err
	} else if _, err := p.Accept(TokRBrace); err != nil {
		return nil, err
	} else {
		return &AutoScratchExp{Exp: inner}, nil
	}
}

// BinOp

var binOpTokens = map[int]Op{
	TokPlus:        Add,
	TokMinus:       Sub,
	TokStarStar:    Pow,
	TokStar:        Mul,
	TokSlash:       Div,
	TokPercent:     Mod,
	TokHat:         Xor,
	TokAmp:         And,
	TokPipe:        Or,
	TokArrowRight3: ASR,
	TokArrowRight2: LSR,
	TokArrowLeft2:  LSL,
}

type BinOpParselet struct {
	Prec    int
	IsRight bool
}

func (b *BinOpParselet) Parse(p *Parser, left any, tok alex.Token) (any, error) {
	relPrec := b.Prec
	if b.IsRight {
		relPrec--
	}

	right, err := p.parseExpr(relPrec)
	if err != nil {
		return nil, err
	}

	return &BinOpExp{Left: left, Op: binOpTokens[tok.Type], Right: right}, nil
}

func (b *BinOpParselet) Precedence() int {
	return b.Prec
}

// Call

type CallParselet struct{}

func (c *CallParselet) Parse(p *Parser, left any, tok alex.Token) (any, error) {
	var args []any

	if !p.At(TokRParen) {
		for {
			arg, err := p.parseExpression()
			if err != nil {
				return nil, err
			}

			args = append(args, arg)

			if !p.Try(TokComma) {
				break
			}
		}
	}

	if _, err := p.Accept(TokRParen); err != nil {
		return nil, err
	}

	return &Call{Fn: left, Args: args}, nil
}

func (c *CallParselet) Precedence() int { return PrecCall }
