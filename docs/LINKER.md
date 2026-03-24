# Linker

Physical memory is going to be implicit.

## Syntax

  - single character mnemonics

```
; move current pointer to absolute address
@ 0x000000

; align current pointer to next multiple of N
A 4

; place section at current pointer
P init

; define a symbol at current pointer
D framebuffer

; jump current pointer forward by N bytes
J 100
```

## Default Linker Script

```
@ 0x0
P init

A 4
P main

A 4
P code

A 4
P data

@ 0x8000

D framebuffer_start
J 32768
D framebuffer_end

D palette_start
J 512
D palette_end

D frame_stack_start
J 1024
D frame_stack_end

D data_stack_start
J 8192
D data_stack_end

D jump_table_start
J 1024
D jump_table_end
```
