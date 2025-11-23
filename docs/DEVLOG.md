## Upcoming Work


  - [ ] Set up proper TypeScript/JavaScript project
  - [ ] Refactor AST to be concrete types
  - [ ] Rework parser so AST is annotated with line numbers
  - [ ] Assembler: codegen

## Day 7

JavaScript for the emulator was a mistake, WASM is a thing, and it will allow us to share code between emu/HW.
Let's see if I can still do C...
(I was considering Zig but prior experience making VM-type-stuff says macros are useful for this type of thing and my Zig comptime-fu is pretty weak... we'll use Zig for the Next Project (tm))

  - [x] Set up Emscripten for building WASM core
  - [ ] Get basic browser/WASM integration setup
  - [ ] Port emulator core to C
  - [ ] Rework JS emulator to use WASM core

## Day 6

  - [x] Basic framebuffer output

## Day 5

  - [x] Assembler: parser
  - [x] Assembler: parser labels
  - [x] Assembler: typechecking framework

## Day 4

  - [x] Assembler: tokenizer

## Offstream

  - [x] Create spreadsheet of instructions, opcodes, operands etc

## Day 3

  - [x] Emu - data structures for frames etc
  - [x] Emu - methods for getting/setting registers (frame-relative)
  - [x] Emu - implement methods to dump registers
  - [x] CALL / RET / RSV
