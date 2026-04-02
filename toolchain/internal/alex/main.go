package alex

import (
	"errors"
	"regexp"
	"strings"
)

const (
	// Token returned, repeatedly, once the end of the input text is reached.
	EOF = -1

	// Sentinel value for error token; check error return value
	Error = -2
)

func ID(str string) string { return str }

func R(pattern string, tok int) Rule {
	return Rule{
		Pattern: pattern,
		Token:   func(string) int { return tok },
		Decoder: ID,
	}
}

func RF(pattern string, token func(string) int) Rule {
	return Rule{
		Pattern: pattern,
		Token:   token,
		Decoder: ID,
	}
}

func RD(pattern string, tok int, decode func(string) string) Rule {
	if decode == nil {
		decode = ID
	}

	return Rule{
		Pattern: pattern,
		Token:   func(string) int { return tok },
		Decoder: decode,
	}
}

func RFD(pattern string, token func(string) int, decode func(string) string) Rule {
	return Rule{
		Pattern: pattern,
		Token:   token,
		Decoder: decode,
	}
}

// Lexer rule
type Rule struct {
	// Regexp pattern to match. Must not be anchored. If subgroups are used,
	// they must be non-capturing.
	Pattern string

	// Token to return on match; must be >= 0
	Token func(match string) int

	// Optional function to decode the token text before returning it from
	// the lexer. Use this, for example, to strip extraneous punctuation or
	// decode string literals.
	Decoder func(string) string
}

// Decode() decodes a token matched by this rule using the rule's decoder.
// If the Rule has no decoder, the token is returned unaltered.
func (r Rule) Decode(str string) string {
	if r.Decoder != nil {
		return r.Decoder(str)
	}
	return str
}

// Lexer definition
type Definition struct {
	rules   []Rule
	regex   *regexp.Regexp
	ignored map[int]bool
	names   map[int]string
}

func Define(rules []Rule, ignoredTokens []int, tokenNames map[int]string) *Definition {
	b := strings.Builder{}
	b.WriteString("^(")
	for i, r := range rules {
		if i > 0 {
			b.WriteByte('|')
		}
		b.WriteByte('(')
		b.WriteString(r.Pattern)
		b.WriteByte(')')
	}
	b.WriteString(")")
	r := regexp.MustCompile(b.String())

	ig := make(map[int]bool, len(ignoredTokens))
	for _, it := range ignoredTokens {
		ig[it] = true
	}

	return &Definition{
		rules:   rules,
		regex:   r,
		ignored: ig,
		names:   tokenNames,
	}
}

func (d *Definition) New(text string) *Lexer {
	return &Lexer{
		def:  d,
		text: text,
	}
}

type Lexer struct {
	def    *Definition
	text   string
	offset int
}

func (l *Lexer) Next() (Token, error) {
outer:
	for {
		if l.offset >= len(l.text) {
			return Token{Type: EOF, Text: "<EOF>"}, nil
		}

		ms := l.def.regex.FindStringSubmatch(l.text[l.offset:])
		if ms == nil {
			return Token{Type: Error, Text: "<ERROR>"}, errors.New("failed to scan token")
		}

		for i, str := range ms[2:] {
			if len(str) == 0 {
				continue
			}
			r := l.def.rules[i]
			l.offset += len(str)

			tok := r.Token(str)
			if l.def.ignored[tok] {
				continue outer
			}
			return Token{Type: tok, Text: r.Decode(str)}, nil
		}
	}
}

func (l *Lexer) Name(tok int) string {
	return l.def.names[tok]
}
