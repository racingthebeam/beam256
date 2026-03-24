package main

import (
	"github.com/alecthomas/kong"
)

type CLI struct {
	Build CmdBuild `cmd:"" name:"build" aliases:"b"`
}

func main() {
	var cli CLI
	ctx := kong.Parse(&cli)
	ctx.FatalIfErrorf(ctx.Run())
}
