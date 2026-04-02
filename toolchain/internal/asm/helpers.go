package asm

import "strings"

func decodeAutoScratchReg(token string) string {
	return strings.TrimSpace(token[1 : len(token)-1])[1:]
}

func must[E any](v E, err error) E {
	if err != nil {
		panic(err)
	}
	return v
}

func decodeString(token string) string {
	b := strings.Builder{}
	for i := 1; i < len(token)-1; i++ {
		if token[i] == '\\' {
			i++
			switch token[i] {
			case 'n':
				b.WriteByte('\n')
			case 't':
				b.WriteByte('\t')
			case 'r':
				b.WriteByte('\r')
			case '"':
				b.WriteByte('"')
			default:
				panic("unhandled escape character!")
			}
		} else {
			b.WriteByte(token[i])
		}
	}
	return b.String()
}

func encodeString(s string) string {
	b := strings.Builder{}
	b.WriteByte('"')
	for i := 0; i < len(s); i++ {
		switch s[i] {
		case '\r':
			b.WriteString("\\r")
		case '\n':
			b.WriteString("\\n")
		case '\t':
			b.WriteString("\\t")
		case '"':
			b.WriteString("\\\"")
		default:
			b.WriteByte(s[i])
		}
	}
	b.WriteByte('"')

	return b.String()
}
