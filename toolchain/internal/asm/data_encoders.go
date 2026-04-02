package asm

var encoders = map[string]encoder{
	"NONE":      {},
	"B24":       {ce(O0, 24, 0)},
	"B12_B6_B6": {ce(O0, 12, 12), ce(O1, 6, 6), ce(O2, 6, 0)},
	"F2_B6_B16": {ce(FLAGS, 2, 22), ce(O0, 6, 16), ce(O1, 16, 0)},
}
