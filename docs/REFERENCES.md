# NOTES

Graphics modes?
  - bitmap display
    - indexed colour palette
      - 4bpp
      - 8bpp
    - Gameboy-style tile renderer?
    - Display list?

## CHIP8

4K, 512B for interpreter, top 256B = display
96 bytes for stack
16x8 registers, V0-VF (VF inc. carry, collision detection)
I reg - address reg
2 x 60Hz timers
stack - only for return addresses
16 key input
64x32 mono; sprites are 8x(1-15)px, XOR-based blitting

35 opcodes
  - CALL
  - CLS
  - RETURN
  - JMP
  - CALL subroutine
  - CMP reg to constant/reg
  - SET reg
  - INC reg by constant
  - ASSIGN reg to reg
  - bitwise: OR, AND, XOR, SUB, ADD, SHIFT
  - EQ / NEQ
  - RAND

## CHIP16

16 bit words, LE
Registers - PC, SP, 16 general, 1 flag (neg, carry, zero, ovf)
1MHz
All instructions are 1 cycle / 4 byte
64KiB RAM, 320x240 res, 4 bit indexed colour

Hidden registers - bg, spritew, spriteh, hflip, vflip - graphics state
PAL to modify palette?

### Sound
Fixed tones for millis
Play tone from memory

### Input
8 button controllers x 2

### Instructions
  - NOP
  - CLS
  - VBLNK
  - BGC
  - set sprite w/h
  - draw sprite
  - random # -> register
  - set draw flip
  - sound trigger
  - push, pop
  - jmp abs
  - jmp if carry
  - jmp if x
  - jmp if rx == ry
  - ret
  - direct/indirect loads
  - store
  - add/mul/sub/div, not, negate
  - bitwise AND/OR/XOR

## [catnip](https://github.com/ecilasun/catnip/blob/master/INSTRUCTION_SET.md)

## Other Stuff

  - [Cool Palette Generator](http://mycours.es/colorRampCreator/)
