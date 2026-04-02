package alex

type Token struct {
	Type int
	Text string
	Pos  Position
}

type Position struct {
	Abs int // absolute byte offset, 0-indexed
	Row int // 0-indexed
	Col int // 0-indexed
}
