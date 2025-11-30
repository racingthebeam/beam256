## Upcoming Work

### Assembler stuff

Main goal: get a workflow in place so we assemble the code consumed by day 9.

  - [ ] Rework parser so AST is annotated with line numbers
  - [ ] Assembler: codegen
  - [ ] Refactor AST to be concrete types
  - [ ] Set up proper TypeScript/JavaScript project
  - write the simplest possible assembly program to update the framebuffer (inc. IO READ/WRITE instructions to trigger FB update)
  - manually encode this program and put into machine RAM
  - implement the instructions in the CPU core
  - debug it until it's all working

## Day 11 Plan

  - function call opcodes: PUSH, POP, RSV, CALL, NARGS, SYSCALL
  - IO: READ, WRITE (with testing for event forwarding)
  - LOAD, STORE, plus split-reg indexed operations (not yet documented)
  - unconditional jumps
  - extend maths operations with support for signed operations and immediate values

That's ambitious but if we can knock all that out in a day then next Sunday we can do all the conditional jumps, of which there seem to be dozens, and looks like an all-round miserable time. After *that* we can finally start looking at some hardware.

As you can see I'm doing everything I can to avoid setting up a TypeScript pipeline.

## Day 10

Late start today, work emergency...
We'll get as many opcodes done as we can...

Think we'll just move POW to stdlib
Bug: something up with parsing hex values (maybe those starting with numbers?)
  - see commented out MOV test
  - come back to this when we've got parser/lexer tests

What we got done:
  - MOV, MOVL, MOVH
  - unsigned maths (reg-reg)
  - bit shifts, inc. arithmetic (reg-reg)

## Day 9

OK so small change of plan.

Original plan - bodge our way through directly encoding a bunch of assembler instructions to create a program that updates the framebuffer.

New plan - get exactly ONE opcode working, end to end, including unit tests.
End to end - parse assembly, emit code, load up VM, run code, inspect/assert machine state.

success_kid.gif

That went pretty well - we have an end to end testing framework with:

  - tests defined in node.js
  - each test takes human-readable assembly and produces binary code
  - binary code is loaded into CPU
  - run the CPU until it halts
  - check the CPU/memory state vs expected

Things outstanding:

  - codegen doesn't deal with anything except instructions i.e. no directives, labels
  - tons and tons of instructions still to implement

## Day 8 Plan (short stream)

  - [x] set up a UI with display, code editor, transport controls

We'll use Codemirror, used it tons before, it's fine
For prototyping we'll stick with CM5 because fuck setting up bundlers

  - [~] set up C LSP - LOL, no, what a shitshow. do it later...

  - [x] work out how we can signal redraw from WASM -> JS

OK let's work out how we're going to trigger the emulator to draw the framebuffer.
We'll use a write to an IO port (not yet documented) to trigger the redraw.
We're not executing any code yet so let's worry about getting the mechanism in place - we can just trigger it on init.

Possible approaches:
  - have the tick function return a bitmask of events to handle
  - have the tick function return early if an event occurs, return value is event
  - callback function that is triggered during tick; WASM can can __also__ elect to return early if necessary. callback function has 2 params - event ID and optional argument. Maybe absolute tick/cycle count too? Maybe later.

Exhausted, giving up for now.

Update: I took a break, read the docs, and solved it in 10 minutes.

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
