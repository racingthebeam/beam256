package linker

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSpanOverlap(t *testing.T) {
	ref := span{10, 20}

	tvs := []span{
		{1, 5},
		{1, 10},

		{5, 11},
		{12, 14},
		{18, 20},
		{19, 22},

		{20, 30},
		{21, 23},
	}

	rs := []bool{
		false,
		false,

		true,
		true,
		true,
		true,

		false,
		false,
	}

	for i := range tvs {
		assert.Equal(t, rs[i], ref.Overlaps(tvs[i]))
		assert.Equal(t, rs[i], tvs[i].Overlaps(ref))
	}
}

func TestSpans(t *testing.T) {
	ss := spans{Size: 1024}

	ss.AddInterval(10, 20)
	assert.True(t, ss.AddInterval(2, 2))
	assert.True(t, ss.AddInterval(4, 6))

	assert.False(t, ss.AddInterval(0, 3))
	assert.True(t, ss.AddInterval(4, 0))

	for i := 4; i < 30; i++ {
		assert.False(t, ss.AddInterval(i, 1))
	}

	assert.True(t, ss.AddInterval(30, 1))

}
