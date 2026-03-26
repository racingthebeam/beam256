package main

import (
	"fmt"
	"os"
)

type CmdPackage struct {
	Input  *os.File `name:"in" short:"i" help:"Input GOB file name"`
	Icon   *os.File `name:"icon" optional:"" help:"Icon file"`
	Output string   `name:"out" short:"o" help:"Output file name"`
}

func (c *CmdPackage) Run() error {
	return fmt.Errorf("not implemented")
}

