package alex

func Sub(n int) func(string) string {
	if n < 0 {
		return func(s string) string {
			return s[0 : len(s)+n]
		}
	}
	return func(s string) string {
		return s[n:]
	}
}
