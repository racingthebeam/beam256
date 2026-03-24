package linker

import (
	"bytes"
	"fmt"
)

const DefaultScript = `
@ 0
p init

a 4
p code

a 4
p data

@ 0x8000

d framebuffer_start
r 32768
d framebuffer_end

d palette_start
r 512
d palette_end

d frame_stack_start
r 1024
d frame_stack_end

d data_stack_start
r 8192
d data_stack_end

d jump_table_start
r 1024
d jump_table_end
`

func Default() *Script {
	script, err := parser.Parse("default.lnk", bytes.NewReader([]byte(DefaultScript)))
	if err != nil {
		panic(fmt.Errorf("failed to parse default linker script: %s", err))
	}

	return script
}
