package alex

import (
	"testing"
)

// FIXME: this test assumes internal behaviour of bytes.Reader
// Should be rewritten to be resilient to changes in the wrapped
// io.Reader
func TestNLReader(t *testing.T) {
	// bs := []byte{1, 2, 3, 4, 5}
	// br := bytes.NewReader(bs)
	//
	// r := NewNLReader(br)
	//
	// d1 := make([]byte, 2)
	// n, err := r.Read(d1)
	// assert.Nil(t, err)
	// assert.Equal(t, 2, n)
	//
	// n, err = r.Read(d1)
	// assert.Nil(t, err)
	// assert.Equal(t, 2, n)
	//
	// n, err = r.Read(d1)
	// assert.Nil(t, err)
	// assert.Equal(t, 1, n)
	//
	// n, err = r.Read(d1)
	// assert.ErrorIs(t, err, io.EOF)
	// assert.Equal(t, 1, n)
	// assert.Equal(t, uint8('\n'), d1[0])
}
