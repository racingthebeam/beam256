package main

import (
	"strings"
	"syscall/js"
)

func Build(this js.Value, args []js.Value) any {
	return js.ValueOf(strings.ToUpper(args[0].String()))
}

func main() {
	c := make(chan int)
	js.Global().Set("beam256_build", js.FuncOf(Build))
	<-c
}
