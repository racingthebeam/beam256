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

## Day 17

### Plan

  - Hardware planning!

All things going well we should be able to spend the pre-Christmas session on hardware planning and placing a fat DigiKey order so we can play with some hardware in the new year!

## Day 16

### Plan

  - Implementing all conditional jumps!
    1. J{Z,NZ,LTZ,LEZ,GTZ,GEZ} r, rel - 6 opcodes
    2. J{EQ,NE,LT,LE,GT,GE} r0, r1, rel - 6 opcodes
    3. J{EQ,NE,LT,LE,GT,GE} r0, imm, rel - 6 opcodes
    4. J{LT,GT,GE,GT}U r0, r1, rel, - 4 opcodes (unsigned comparisons)
  - Phase 1 review

### Actual

  - Conditional jumps, encoding:
    1. reg:u7, rel:s17 - the comparisons against 0 can literally jump anywhere
      - should this maybe just be an absolute jump?
    2. reg:u7, reg:u7, rel:s9 - +/-256 instructions (+/- 1024 bytes)
    3. reg:u7, imm:u8, rel:s9 - +/-256 instructions (+/- 1024 bytes)
    4. reg:u7, reg:u7, rel:s9 - +/-256 instructions (+/- 1024 bytes)

New codecs needed: reg_reg_s9, reg_u8_s9

### Quick Phase 1 Review

Currently the stack is external to main memory
64KB of WIRED memory, 256KB full size
Decision: move stack to main memory - this will allow fun tricks, possibly
context switching etc.
Stack pointer would be a "far" pointer - not constrained by the MMU.

Memory is 32 x 8KB pages
So - reserve top page (page 31) for stack etc.
  - stack - 6KiB
  - frame stack - 1KiB (16 bytes per entry - max call stack size = 64)
  - palette - 1KiB (256 x 4 byte RGB entries)

New opcodes: SCTX and LCTX (save and load CPU context) (2)
  - saves stack pointer and address of active frame
  - over provision amount of RAM for saved context to account for future changes

Switch to signed maths being the default - unsigned operations will be the special cases.

LOAD and STORE need B,H and W variants
Total variants - 4 x 3 = 12. Currently have 4, so 8 extra needed (8)

Other opcodes (11):
  - SWP r0, r1 (1)
  - DUP top of stack, ROTATE top of stack (2)
  - ROTATE (LEFT, RIGHT) - few variants required (4)
  - IO-wait opcode (port, mask register, value register) (1)
  - jump tables (absolute/indirect) (1)
  - ADD_MUL rdst, rval, rscale # REG[rdst] = REG[rdst] + (REG[rval] * REG[rscale]) (2)

## Day 15

### Plan

  - [x] LOADX (B, H, W variants)
  - [x] STOREF, LOADF (B, H, W variants)
  - [x] Maths opcodes with immediate operands
  - Plan out all the conditional jumps

## Day 14

### Plan

  - [x] MOV Rd, Rsrc, Roffset
  - [x] Signed multiplication/division
  - [x] NEG
  - [x] ABS
  - [x] {BSET, BTOG, BCLR} Rdst, Rsrc, Rbit
  - [x] BTST Rdst, Rsrc, Rbit
  - [x] {BSET, BTOG, BCLR} Rdst, Rsrc, imm
  - [x] BTST Rdst, Rsrc, imm
  - [x] STOREX (B, H, W variants) (immediate and register based)

Do we need these bit-test instructions?
We're going to have a HUGE number of conditional jump instructions.
Benefits of these:
  - don't need to create the AND mask
  - get a guaranteed 0 or 1 output

## Day 13

### Plan

  - LOAD, STORE split-reg indexed operations
  - some conditional jumps

### Actual

Implemented (native function calls) and all related opcodes:

  - CALL (immediate address and register-based)
  - NARGS - to get number of arguments from call frame
  - RET (immediate value and register-based)

## Off-stream

  - write up docs for split-reg indexed operations

## Day 12 (mid-week)

### Plan

  - built-in function calls
  - function call opcodes: CALL, NARGS
  - implement sign-extended 24 bit encoding for PUSH immediate
    - OR OR OR - do we just stick with S17 encoding - we have it already?!
    - I think laziness will prevail here, let's just use S17

### Actual

Gonna stick with S17 encoding for PUSH immediate
Implemented PUSH immediate, tested with negative numbers

OK, next up - BIFs. We're just implemented in the mechanics of the call,
not implement an actual table of functions.
BIFs implemented! We ended up making a table after all, but still need to work out a way of encoding it elegantly. Funky xmacro time?

Realised my idea for implementing CALL where the instruction encoding specifies register for return value isn't workable without modifying machine internals (stack frame needs to record where to put return value) - now wondering if it's better just to say all CALL forms leave the return value on the stack. But then there's no way of calling a function without returning a value.

This is going to require some off-stream thought; too tired to reach a meaningful decision tonight.

Let's try to un-fuck the mess I made.



## Day 11

### Plan

NB: need to extend assembler to support `.org`, `.align`, and literal data

  - function call opcodes: PUSH, POP, RSV, CALL, NARGS, SYSCALL
  - IO: READ, WRITE (with testing for event forwarding)
  - LOAD, STORE, plus split-reg indexed operations (not yet documented)
  - unconditional jumps

That's ambitious but if we can knock all that out in a day then next Sunday we can do all the conditional jumps, of which there seem to be dozens, and looks like an all-round miserable time. After *that* we can finally start looking at some hardware.

As you can see I'm doing everything I can to avoid setting up a TypeScript pipeline.

### Report

Twas a late start, will not get everything done that I wanted. Punt signed math ops to next week!

codegen is extended to support org, align, zero, literal data
unconditional jumps done & tested

i think we'll rename the IO instructions to IN and OUT, gives me Z80 fuzzies

IO IN/OUT done and tested, including event forwarding

LOAD/STORE done, we'll leave the indexing operations till next session (maybe try that mid-week?) - I haven't written up my plans for that yet and I've lost my train of thought. Also it needs a new complex instruction encoding with a couple of flags. Yeh, do that during the week!

Almost 3 hours in... do i have the energy for function calls/stack shenanigans...

No energy for the full native call stuff - but let's do SYSCALL. It's nice and simple.
Updated the design doc and wrote up how SYSCALL (now BCALL for "built in function call") will work
Implemented PUSH, POP, RSV, and DUMP

Will do BCALL next session, wasted a ton of time with PUSH/POP debugging.

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
