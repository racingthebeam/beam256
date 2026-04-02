package linker

import (
	"bytes"
	"fmt"
)

const DefaultScript = `
; This is the default linker script for BEAM256!

@ 0
; i
	
a 4
p main

a 4
p code

a 4
p data

j 0x8000
p framebuffer

j 0x10000
p palette
	
d frame_stack_base
r 1024
d frame_stack_end

d data_stack_base
r 8192
d data_stack_end

d jump_table_base
r 1024
d jump_table_end

; i think i prefer this...
; n => "null section"
; n frame_stack 1024
; n data_stack 8192
; n jump_table 1024
`

func Default() *Script {
	script, err := parser.Parse("default.lnk", bytes.NewReader([]byte(DefaultScript)))
	if err != nil {
		panic(fmt.Errorf("failed to parse default linker script: %s", err))
	}

	return script
}
