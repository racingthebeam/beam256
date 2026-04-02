package asm

import (
	"fmt"
	"math"

	"github.com/racingthebeam/beam256/toolchain/internal/ft"
)

func Eval(syms *SymbolTable, expr any) (int64, error) {
	switch t := expr.(type) {
	case *BinOpExp:
		if left, err := Eval(syms, t.Left); err != nil {
			return 0, err
		} else if right, err := Eval(syms, t.Right); err != nil {
			return 0, err
		} else {
			return evalBinOp(left, t.Op, right)
		}
	case *UnOpExp:
		if val, err := Eval(syms, t.Exp); err != nil {
			return 0, err
		} else {
			return evalUnOp(t.Op, val)
		}
	case *Call:
		fnName, ok := t.Fn.(AtIdent)
		if !ok {
			return 0, fmt.Errorf("value is not callable")
		} else if fn, ok := functions[fnName]; !ok {
			return 0, fmt.Errorf("unknown function @%s", fnName)
		} else {
			vals := make([]int64, len(t.Args))
			for i, exp := range t.Args {
				v, err := Eval(syms, exp)
				if err != nil {
					return 0, fmt.Errorf("failed to evaluate argument for @%s at position %d: %s", fnName, i, err)
				}
				vals[i] = v
			}
			return fn(vals)
		}
	case Ident:
		ent, found := syms.Lookup(ft.Symbol(t))
		if !found {
			return 0, fmt.Errorf("reference to undefined symbol %s", t)
		} else if !ent.IsDef() {
			return 0, fmt.Errorf("referenced symbol %s is not a definition", t)
		} else {
			return ent.Value, nil
		}
	case Number:
		return t.NumVal(), nil
	case NumReg:
		return 0, fmt.Errorf("register reference $%d is not valid in static expression", t)
	case NamedReg:
		return 0, fmt.Errorf("register reference $%s is not valid in static expression", t)
	case AtIdent:
		return 0, fmt.Errorf("built in function reference @%s is not valid in non-call position", string(t))
	default:
		return 0, fmt.Errorf("found unexpected AST node %T while evaluating expression - this is a bug", expr)
	}
}

func evalUnOp(op Op, val int64) (int64, error) {
	switch op {
	case Not:
		return ^val, nil
	case Neg:
		return -val, nil
	case Pos:
		return +val, nil
	default:
		return 0, fmt.Errorf("unhandled operator %s in unary expression - this is a bug", op.String())
	}

}
func evalBinOp(left int64, op Op, right int64) (int64, error) {
	switch op {
	case Add:
		return left + right, nil
	case Sub:
		return left - right, nil
	case Mul:
		return left * right, nil
	case Div:
		return left / right, nil
	case LSL:
		return left << right, nil
	case LSR:
		return int64(uint64(left) >> right), nil
	case ASR:
		return left >> right, nil
	case Pow:
		return int64(math.Pow(float64(left), float64(right))), nil
	case Mod:
		return left % right, nil
	case And:
		return left & right, nil
	case Or:
		return left | right, nil
	case Xor:
		return left ^ right, nil
	default:
		return 0, fmt.Errorf("unhandled operator %s in binary expression - this is a bug", op.String())
	}
}
