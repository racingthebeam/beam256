package asm

var flagSets = map[string]*FlagSet{
	"HALT":       NewFlagSet("b", 6),
	"REL_JMP":    NewFlagSet("di", 2),
	"STORE_LOAD": NewFlagSet("ix", 2),
	"SIGN_EX":    NewFlagSet("x", 1),
}
