package linker

func alignVal(n int, align int) int {
	mod := n % align
	if mod == 0 {
		return n
	} else {
		return n + (align - mod)
	}
}

func relCallBits(delta int) uint32 {
	return uint32((delta - 4) >> 2)
}
