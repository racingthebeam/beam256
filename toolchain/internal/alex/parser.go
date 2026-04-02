package alex

import "fmt"

type ErrUnexpectedToken struct {
	Expected, Actual string
}

func (ut ErrUnexpectedToken) Error() string {
	return fmt.Sprintf("unexpected token: expected %s, got %s", ut.Expected, ut.Actual)
}

type Parser struct {
	Lexer *Lexer

	curr    Token
	currErr error
}

func NewParser(l *Lexer) *Parser {
	return &Parser{Lexer: l}
}

func (p *Parser) Start() error {
	p.Adv()
	return p.currErr
}

func (p *Parser) Curr() Token   { return p.curr }
func (p *Parser) At(t int) bool { return p.curr.Type == t }
func (p *Parser) Err() error    { return p.currErr }

// Advance to the next token, returning the previous token
func (p *Parser) Adv() Token {
	out := p.curr
	p.curr, p.currErr = p.Lexer.Next()
	return out
}

func (p *Parser) Accept(tok int) (Token, error) {
	if tok != p.curr.Type {
		return Token{}, ErrUnexpectedToken{Expected: p.Lexer.Name(tok), Actual: p.Lexer.Name(p.curr.Type)}
	}
	return p.Adv(), nil
}

func (p *Parser) Try(tok int) bool {
	if p.At(tok) {
		p.Adv()
		return true
	}
	return false
}
