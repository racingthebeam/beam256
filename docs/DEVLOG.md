## Upcoming Work

### Emulator

  - [ ] Port emulator core to C

### Assembler stuff

  - [ ] Rework parser so AST is annotated with line numbers
  - [ ] Assembler: codegen
  - [ ] Refactor AST to be concrete types
  - [ ] Set up proper TypeScript/JavaScript project

## Day 9 Plan

  - pick tiny subset of instructions and implement in C (enough to update framebuffer in a loop)
  - implement IO READ/WRITE instructions to trigger framebuffer update
  - finish assembler for this instruction subset (parse/type check/compile), then run

## Day 8 Plan (short stream)

  - [x] set up a UI with display, code editor, transport controls

We'll use Codemirror, used it tons before, it's fine
For prototyping we'll stick with CM5 because fuck setting up bundlers

  - [~] set up C LSP - LOL, no, what a shitshow. do it later...

  - [ ] work out how we can signal redraw from WASM -> JS

OK let's work out how we're going to trigger the emulator to draw the framebuffer.
We'll use a write to an IO port (not yet documented) to trigger the redraw.
We're not executing any code yet so let's worry about getting the mechanism in place - we can just trigger it on init.

Possible approaches:
  - have the tick function return a bitmask of events to handle
  - have the tick function return early if an event occurs, return value is event
  - callback function that is triggered during tick; WASM can can __also__ elect to return early if necessary. callback function has 2 params - event ID and optional argument. Maybe absolute tick/cycle count too? Maybe later.

Exhausted, giving up for now.

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
