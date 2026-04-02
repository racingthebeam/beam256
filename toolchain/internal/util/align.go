package util

func Align(n int, align int) int {
	mod := n % align
	if mod == 0 {
		return n
	} else {
		return n + (align - mod)
	}
}
