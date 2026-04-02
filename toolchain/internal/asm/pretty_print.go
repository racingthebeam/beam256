package asm

import (
	"fmt"
	"io"
	"strconv"

	"github.com/fatih/color"
)

var (
	colOp      = color.New(color.FgYellow).SprintFunc()
	colDir     = color.New(color.FgCyan).SprintFunc()
	colStr     = color.New(color.FgWhite).SprintFunc()
	colReg     = color.New(color.FgBlue).SprintFunc()
	colNum     = color.New(color.FgMagenta).SprintFunc()
	colLabel   = color.New(color.FgGreen).SprintFunc()
	colIdent   = color.New(color.FgGreen).SprintFunc()
	colError   = color.New(color.FgRed).SprintFunc()
	colKeyword = color.New(color.FgCyan).SprintFunc()
)

type Printer struct {
	W         io.Writer
	last      any
	exprDepth int
}

func NewPrinter(w io.Writer, useColor bool) *Printer {
	return &Printer{
		W: w,
	}
}

func (p *Printer) Print(prog *Program) {
	p.printStatements(prog.Statements)
}

func (p *Printer) printStatements(ss []any) {
	for _, stmt := range ss {
		switch t := stmt.(type) {

		//
		// Directives

		case *DirInclude,
			*DirDefine,
			*DirUndefine,
			*DirSection,
			*DirAlign,
			*DirPushOpt,
			*DirPopOpt,
			*DirSetOpt:
			p.printDirective(t)
		case *DirZeroes,
			*DirBytes,
			*DirHalfWords,
			*DirWords:
			p.printDataDirective(t)

		//
		// Other

		case Label:
			p.print(colLabel(t+":") + "\n")
		case *Instruction:
			p.printIns(t)
		case *Print:
			p.printPrint(t)
		case *FnDef:
			p.printFnDef(t)
		}

		p.last = stmt
	}
}

func (p *Printer) printIns(i *Instruction) {
	p.print("    ")

	op := i.Mnemonic
	if i.Flags != "" {
		op += "." + i.Flags
	}

	p.print(colOp(op))
	p.printOperands(i.Operands, " ")
	p.print("\n")
}

func (p *Printer) printPrint(i *Print) {
	p.print("    ")
	p.print(colOp("print "))
	p.printValue(i.String)
	p.printOperands(i.Operands, ", ")
	p.print("\n")
}

func (p *Printer) printOperands(ops []any, sep string) {
	if len(ops) > 0 {
		for _, o := range ops {
			p.print(sep)
			p.printExpr(o)
			sep = ", "
		}
	}
}

func (p *Printer) printDirective(dir any) {
	switch t := dir.(type) {
	case *DirInclude:
		p.printDir("include", true)
		p.print(colStr(encodeString(t.Filename)))
	case *DirDefine:
		p.printDir("define", true)
		p.printValue(t.Ident)
		p.print(" ")
		p.printExpr(t.Value)
	case *DirUndefine:
		p.printDir("undef", true)
		p.printValue(t.Ident)
	case *DirSection:
		p.printDir("section", true)
		p.print(colIdent(t.Name))
	case *DirAlign:
		p.printDir("align", true)
		p.print(colNum(fmt.Sprintf("%d", t.Alignment)))
	case *DirPushOpt:
		p.printDir("pushopt", false)
	case *DirSetOpt:
		p.printDir("setopt", true)
		p.print(colIdent(t.Key))
		p.print(" ")
		p.printValue(t.Value)
	case *DirPopOpt:
		p.printDir("popopt", false)
	}
	p.print("\n")
}

func (p *Printer) printDataDirective(dir any) {
	switch t := dir.(type) {
	case *DirZeroes:
		p.printDir("z", true)
		p.printExpr(t.Count)
	case *DirBytes:
		p.printDir("b", true)
		p.printDirData(t.Values)
	case *DirHalfWords:
		p.printDir("h", true)
		p.printDirData(t.Values)
	case *DirWords:
		p.printDir("w", true)
		p.printDirData(t.Values)
	}
	p.print("\n")
}

func (p *Printer) printDirData(vals []any) {
	sep := ""
	for _, v := range vals {
		p.print(sep)
		p.printExpr(v)
		sep = ", "
	}
}

func (p *Printer) printDir(name string, space bool) {
	p.print(colDir("." + name))
	if space {
		p.print(" ")
	}
}

func (p *Printer) printFnDef(i *FnDef) {
	p.print("\n")
	p.print(colKeyword("def ") + colIdent(i.Name) + "(")
	p.printRegList(i.Params)
	p.print(")\n")

	if len(i.Locals) > 0 {
		p.print(colKeyword("    local "))
		p.printRegList(i.Locals)
		p.print("\n")
	}

	p.printStatements(i.Body)

	p.print(colKeyword("end\n"))
}

func (p *Printer) printRegList(regs []NamedReg) {
	if len(regs) == 0 {
		return
	}
	for i := range regs {
		if i > 0 {
			p.print(", ")
		}
		p.printValue(regs[i])
	}
}

func (p *Printer) printExpr(v any) {
	switch t := v.(type) {
	case *BinOpExp:
		// if p.exprDepth > 0 {
		p.print("(")
		// }
		// p.exprDepth++
		p.printExpr(t.Left)
		p.print(" ")
		p.print(t.Op.String())
		p.print(" ")
		p.printExpr(t.Right)
		// p.exprDepth--
		// if p.exprDepth > 0 {
		p.print(")")
		// }
	case *UnOpExp:
		p.print(t.Op.String())
		p.printExpr(t.Exp)
	case *Call:
		p.printExpr(t.Fn)
		p.print("(")
		for i, arg := range t.Args {
			if i > 0 {
				p.print(", ")
			}
			p.printExpr(arg)
		}
		p.print(")")
	case *AutoScratchExp:
		p.print("{")
		p.printExpr(t.Exp)
		p.print("}")
	default:
		p.printValue(v)
	}
}

func (p *Printer) printValue(v any) {
	switch t := v.(type) {
	case string:
		p.print(colStr(encodeString(t)))
	case NamedReg:
		p.print(colReg("$" + t))
	case NumReg:
		p.print(colReg("$" + strconv.Itoa(int(t))))
	case Ident:
		p.print(colIdent(t))
	case AtIdent:
		p.print(colIdent("@" + t))
	case Int:
		p.print(colNum(strconv.FormatInt(int64(t), 10)))
	case Hex:
		p.print(colNum("0x", strconv.FormatInt(int64(t), 16)))
	case Bin:
		p.print(colNum("0b", strconv.FormatInt(int64(t), 2)))
	default:
		p.print(colError(fmt.Sprintf("%+v", t)))
	}
}

func (p *Printer) print(str string) {
	fmt.Fprint(p.W, str)
}
