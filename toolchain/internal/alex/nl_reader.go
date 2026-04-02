package alex

import (
	"errors"
	"io"
)

// NLReader is an io.Reader wrapper that inserts a newline
// before EOF, designed to simplify the implementation of
// line-oriented parsers.
type NLReader struct {
	r     io.Reader
	state int
}

func NewNLReader(r io.Reader) *NLReader {
	return &NLReader{r: r}
}

func (r *NLReader) Read(b []byte) (int, error) {
	switch r.state {
	case 0:
		n, err := r.r.Read(b)
		if errors.Is(err, io.EOF) {
			if n < len(b) {
				b[n] = '\n'
				r.state = 2
				return n + 1, nil
			} else {
				r.state = 1
				return n, nil
			}
		} else {
			return n, err
		}
	case 1:
		if len(b) == 0 {
			return 0, nil
		}
		b[0] = '\n'
		r.state = 2
		return 1, nil
	case 2:
		return 0, io.EOF
	default:
		panic("state error")
	}
}
