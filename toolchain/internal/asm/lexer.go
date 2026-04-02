package asm

import (
	"strings"

	"github.com/racingthebeam/beam256/toolchain/internal/alex"
)

const (
	TokComma = iota + 1
	TokLParen
	TokRParen
	TokLBrace
	TokRBrace
	TokPlus
	TokMinus
	TokStarStar
	TokStar
	TokSlash
	TokPercent
	TokHat
	TokAmp
	TokPipe
	TokTilde
	TokArrowRight3
	TokArrowRight2
	TokArrowLeft2
	TokDef
	TokLocal
	TokEnd
	TokLabel
	TokAtIdent
	TokDotIdent
	TokIdent
	TokNamedReg
	TokNumReg
	TokHex
	TokBin
	TokInt
	TokString
	TokNL
	TokComment
	TokWS
)

var tokenNames = map[int]string{
	TokComma:       "COMMA",
	TokLParen:      "L_PAREN",
	TokRParen:      "R_PAREN",
	TokLBrace:      "L_BRACE",
	TokRBrace:      "R_BRACE",
	TokPlus:        "PLUS",
	TokMinus:       "MINUS",
	TokStarStar:    "STAR_STAR",
	TokStar:        "STAR",
	TokSlash:       "SLASH",
	TokPercent:     "PERCENT",
	TokHat:         "HAT",
	TokAmp:         "AMP",
	TokPipe:        "PIPE",
	TokTilde:       "TILDE",
	TokArrowRight3: "ARROW_RIGHT_3",
	TokArrowRight2: "ARROW_RIGHT_2",
	TokArrowLeft2:  "ARROW_LEFT_2",
	TokDef:         "DEF",
	TokLocal:       "LOCAL",
	TokEnd:         "END",
	TokLabel:       "LABEL",
	TokAtIdent:     "AT_IDENT",
	TokDotIdent:    "DOT_IDENT",
	TokIdent:       "IDENT",
	TokNamedReg:    "NAMED_REG",
	TokNumReg:      "NUM_REG",
	TokHex:         "HEX",
	TokBin:         "BIN",
	TokInt:         "INT",
	TokString:      "STRING",
	TokNL:          "NL",
	TokComment:     "COMMENT",
	TokWS:          "WS",
}

var (
	R   = alex.R
	RF  = alex.RF
	RD  = alex.RD
	RFD = alex.RFD
)

var keywords = map[string]int{
	"def":   TokDef,
	"local": TokLocal,
	"end":   TokEnd,
}

var Lexer = alex.Define([]alex.Rule{
	R(`,`, TokComma),
	R(`\(`, TokLParen),
	R(`\)`, TokRParen),
	R(`\{`, TokLBrace),
	R(`\}`, TokRBrace),
	R(`\+`, TokPlus),
	R(`\-`, TokMinus),
	R(`\*\*`, TokStarStar),
	R(`\*`, TokStar),
	R(`\/`, TokSlash),
	R(`%`, TokPercent),
	R(`\^`, TokHat),
	R(`\&`, TokAmp),
	R(`\|`, TokPipe),
	R(`\~`, TokTilde),
	R(`>>>`, TokArrowRight3),
	R(`>>`, TokArrowRight2),
	R(`<<`, TokArrowLeft2),

	RD(`[a-zA-Z_][a-zA-Z0-9_]*:`, TokLabel, alex.Sub(-1)),
	RD(`@[a-zA-Z0-9_]+`, TokAtIdent, func(s string) string {
		// at-functions are always internally defined so we
		// can make these case-insensitive
		return strings.ToLower(s[1:])
	}),
	RD(`\.[a-zA-Z0-9_]+`, TokDotIdent, func(s string) string {
		// dot-idents are used only for directives and flags
		// so, again, we can make them case-insensitive
		return strings.ToLower(s[1:])
	}),
	RF(`[a-zA-Z_][a-zA-Z0-9_]*`, func(s string) int {
		tok, ok := keywords[strings.ToLower(s)]
		if ok {
			return tok
		}
		return TokIdent
	}),
	RD(`\$(?:[a-zA-Z_][a-zA-Z0-9_]*)`, TokNamedReg, alex.Sub(1)),
	RD(`\$(?:[0-9]+)`, TokNumReg, alex.Sub(1)),

	R(`0x[0-9a-fA-F_]+`, TokHex),
	R(`0b[01_]+`, TokBin),
	R(`[0-9_]+`, TokInt),

	RD(`"(?:(?:[^\\"]|\\"|\\r|\\n|\\t)*)"`, TokString, decodeString),

	R(`(?:\n|\r\n?)`, TokNL),
	R(`[ \t]+`, TokWS),

	R(`;[^\n]*`, TokComment),
}, []int{
	TokComment,
	TokWS,
}, tokenNames)
