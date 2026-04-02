package asm

import (
	"errors"
	"fmt"
	"math"
	"math/bits"
)

func fn1(impl func(int64) (int64, error)) func([]int64) (int64, error) {
	return func(args []int64) (int64, error) {
		if len(args) != 1 {
			return 0, fmt.Errorf("expect 1 arg, got %d", len(args))
		}
		return impl(args[0])
	}
}

func fn2(impl func(int64, int64) (int64, error)) func([]int64) (int64, error) {
	return func(args []int64) (int64, error) {
		if len(args) != 2 {
			return 0, fmt.Errorf("expect 2 args, got %d", len(args))
		}
		return impl(args[0], args[1])
	}
}

func fn3(impl func(int64, int64, int64) (int64, error)) func([]int64) (int64, error) {
	return func(args []int64) (int64, error) {
		if len(args) != 3 {
			return 0, fmt.Errorf("expect 2 args, got %d", len(args))
		}
		return impl(args[0], args[1], args[2])
	}
}

var functions = map[AtIdent]func([]int64) (int64, error){
	"min": func(is []int64) (int64, error) {
		if len(is) == 0 {
			return 0, errors.New("@min() requires at least one argument")
		}
		v := int64(math.MaxInt64)
		for _, i := range is {
			if i < v {
				v = i
			}
		}
		return v, nil
	},
	"max": func(is []int64) (int64, error) {
		if len(is) == 0 {
			return 0, errors.New("@max() requires at least one argument")
		}
		v := int64(math.MinInt64)
		for _, i := range is {
			if i > v {
				v = i
			}
		}
		return v, nil
	},
	"abs": fn1(func(x int64) (int64, error) {
		if x < 0 {
			return -x, nil
		}
		return x, nil
	}),
	"sign": fn1(func(x int64) (int64, error) {
		if x < 0 {
			return -1, nil
		} else if x > 0 {
			return 1, nil
		}
		return 0, nil
	}),
	"clz": fn1(func(x int64) (int64, error) {
		return int64(bits.LeadingZeros64(uint64(x))), nil
	}),
	"ctz": fn1(func(x int64) (int64, error) {
		return int64(bits.TrailingZeros64(uint64(x))), nil
	}),
	"rol": fn2(func(x int64, c int64) (int64, error) {
		return int64(bits.RotateLeft64(uint64(x), int(c))), nil
	}),
	"ror": fn2(func(x int64, c int64) (int64, error) {
		return int64(bits.RotateLeft64(uint64(x), -int(c))), nil
	}),
	"bitcount": fn1(func(x int64) (int64, error) {
		return int64(bits.OnesCount64(uint64(x))), nil
	}),
	"rgb565": fn3(func(r, g, b int64) (int64, error) {
		r5 := r >> 3
		g6 := g >> 2
		b5 := b >> 3
		return (r5 << 11) | (g6 << 5) | b5, nil
	}),
}
