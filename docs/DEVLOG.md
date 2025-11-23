## Upcoming Work

### Emulator

  - [ ] Port emulator core to C

### Assembler stuff

  - [ ] Rework parser so AST is annotated with line numbers
  - [ ] Assembler: codegen
  - [ ] Refactor AST to be concrete types
  - [ ] Set up proper TypeScript/JavaScript project

## Day 8 Plan

  - set up a UI with display, code editor, transport controls
  - pick tiny subset of instructions and implement in C (enough to update framebuffer in a loop)
  - finish assembler for this instruction subset (parse/type check/compile), then run
  - implement IO READ/WRITE instructions to trigger framebuffer update

## Day 7

JavaScript for the emulator was a mistake, WASM is a thing, and it will allow us to share code between emu/HW.

Let's see if I can still do C...

(I was considering Zig but prior experience making VM-type-stuff says macros are useful for this type of thing and my Zig comptime-fu is pretty weak... we'll use Zig for the Next Project(tm))

  - [x] Set up Emscripten for building WASM core
  - [x] Get basic browser/WASM integration setup
  - [x] Set up machine memory sharing between WASM and JS

Usually at this point I'd start reworking everything and build a complicated system to allow multiple instances to co-exist in a single module instantiation, but in the name of actually making progress we'll just say that each WASM instance hosts precisely one machine instance.

  - [x] Rework JS emulator to use WASM core (restore working framebuffer)

Good progress today - WASM core in place with memory sharing and we can draw the framebuffer from JS!

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
