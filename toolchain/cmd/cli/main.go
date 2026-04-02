package main

import (
	"github.com/alecthomas/kong"
)

type CLI struct {
	Build    CmdBuild    `cmd:"" name:"build" aliases:"b"`
	Package  CmdPackage  `cmd:"" name:"package" aliases:"p"`
	Parse    CmdParse    `cmd:"" name:"parse"`
	Assemble CmdAssemble `cmd:"" name:"assemble"`
}

func main() {
	var cli CLI
	ctx := kong.Parse(&cli)
	ctx.FatalIfErrorf(ctx.Run())
}
