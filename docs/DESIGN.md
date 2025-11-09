# BEAM256 Design Document

BEAM256 is a fantasy console designed to be implementable on real hardware (something like a Raspberry Pi Pico)

Specs:
  - flat memory map
    - I think we'll go with 64KiB of RAM (maybe having a separate area/mode for the framebuffer). 64KiB seems like a good choice because the opcode arrangements are falling such that there's often 2 bytes spare for absolute addresses, which is 65536, 64KiB.
  - stack etc. lives in main memory? hmm...
  - register machine (kinda like Lua)

OK first problem... we can't be *exactly* like Lua because when CALLing a function in Lua, the runtime knows the specification of the callee (specifically, how much space it needs to reserve on the stack for locals... we don't have that luxury...)

Let's think...

I think the best we can do is introduce a new opcode, RSV ("reserve") that is placed at the start of each "function" body (i.e. CALL target) - this instructs the runtime to reserve the specified number of slots for locals. Any next CALL will be guaranteed not to clobber reserved memory.

How does this interplay with argument passing?

i.e. let's say we do

CALL $foo, 4      # jump to $foo, 4 args

$foo:
RSV 2  # reserve another 2 slots for locals

So there are now, in total, 6 slots reserved.
But here's the problem - different CALLs might using different number of args (we'll need some way of getting nargs within a function). But - passing different numbers of args should absolutely not wreck references to the functions local variables.

Solution - shall we say that:
  - register numbers are signed 8 bit
  - negative values = arguments
  - positive values = locals (i.e. thru RSV)
  - reg0 = nargs

I quite like this. OK.

What types of values does the machine support?
i32 and u32
We'll need different opcodes for each, I think this fine.
This will need special handling when it comes to building the emulator in JS, which doesn't have unsigned 32 bit numbers... burn that bridge when we get there.

## Out of scope

Stuff that's currently out of scope, while we get the core "VM" working...

  - graphics (including sprite "hardware")
  - audio
  - IO (e.g. buttons)

## Opcodes

Ops are always encoded 4 using bytes.

Registers are indexed starting from the frame-pointer, so they're actually always stored in memory. They're not registers in the traditional sense.

### Other stuff

  - `NOP`

### Random Number Generation

  - `RAND Rd`
    - set `Rd` to random 32 bit value
  - `RAND Rd, min, max`
    - set `Rd` to random 32 bit value between `min` and `max` (immediate)
  - `RAND Rd, Rmin, Rmax`
    - set `Rd` to random 32 bit value between `Rmin` and `Rmax`

### Load/store

    - SET Rd, Rs
      - the value of Rd to Rs
    - ISTORE Addr, Rs, ILOAD Rs, Addr
      - immediate store/load
    - STORE Raddr, Rs, LOAD Rs, Raddr
      - indirect store/load thru register

How do we deal with constants using this encoding? Hrmmmm... look at ARM thumb? we'll come back to this...

We can choose an instruction encoding that maximises the number of bytes available to store an immediate value... let's say:

```
0x80_00_00_00
```

If the high bit isn't set on any other opcodes we can safely use the rest of the space for reg constant. So, let's say the next 7 bits are reserved for the actual target register (obviously precludes us from targeting all 255 registers, and there's some hoops to jump through if we need to use this in combination with args (which are referenced using negative values)), but this is roughly "fine".

So that leaves us with 24 bits for a constant value.

I *think* this is how ARM thumb works and it uses a bunch of tricks involving shifts/adds to allow a large number of "common" values to be stored in a single instruction.

For anything that *can't* be encoded using this scheme, we can fall back to a simpler scheme:

```
SETCH Rd, val
SETCL Rd, val
```

wherein `H` and `L` suffixes denote high and low. we just an instruction to set each of the high/low parts of the register. that's fine.

in fact - for values in the range 0-65535, why bother fucking about with the ARM stuff. just encode them using immediates.

right, solved that to a suitable degree... onwards...

### Maths

    - ADD Rd, R1, R2
    - SUB Rd, R1, R2
    - MUL Rd, R1, R2
    - DIV Rd, R1, R2
    - POW Rd, R1, R2

### Bitwise

    - OR Rd, R1, R2
    - AND Rd, R1, R2
    - XOR Rd, R1, R2
    - NOT Rd, R
    - LSH Rd, R1, R2
      - left-shift R1 by R2 bits
    - RSH Rd, R1, R2
      - right-shift R1 by R2 bits

### Comparison/control flow ops

    - CMP R1, R2
      - compare values in R1 and R2 and place result in flags register... is there a flags register? I think we need a flags register.
    - JZ Addr
      - jump to absolute address if zero flag
    - JNZ Addr
      - jump to absolute address if not zero flag
    - JC Addr
      - jump to absolute address if carry flag
    - JNC Addr
      - jump to absolute address if not carry flag
    - JEQ Rel, R1, R2
      - relative jump if R1 == R2 (Rel is signed and should be multiplied by 4)
    - JNQ Rel, R1, R2
      - as above, but for R1 != R2

### Function Calling

- CALL Addr, nargs
      - call function at addr*4, reserving nargs slots on the frame for arguments
    - RSV nlocals
      - reserve the specified number of locals on the stack.
    - RET, RET Rr
      - return, with optional return value
      - unlike Lua, we will not support multiple return values, I think

# Emulator Implementation

  - define a memory object (64KiB)
  - define a structure representing the machine, referencing the memory, and any other internal state that we need (flags register etc.)
  - write a suite of functions to generate opcodes
  - then just build it I guess...?

What do we need in terms of debugging tools?
I can't be assed making something complicated. Can we just expose a function or two to the browser console that will dump a region of memory, and maybe the machine state. Sounds fine.

OK so only other thing, how to make it non-blocking so the browser doesn't freeze up. I think the standard way of doing this is just to execute n instructions then yield? Sounds fine.







# Calling Convention

## Frame Stack

To make things simpler for the programming, call frame records are not stored in main memory, instead the vCPU manages them in a private memory area.

Each call frame record consists of:
  - number of arguments
  - return IP
  - previous FP
  - previous SP (not sure if required)

I think that's it. That's 16 bytes if we want to keep it aligned to the host architecture, half that if we want to optimise.

So if we allow for a maximum call depth of 32, that's what, 512 bytes? Not a problem. 64 sounds perfectly doable, and that's getting into Java territory.

We'll need ops to allow interrogation of some of this perhaps, particularly the number of arguments (so its possible to write variadic functions). Not a problem.

So the stack is just for arguments and locals.








The vCPU has a stack pointer and frame pointer; stack grows downwards.

this doesn't work!

to be efficient, the caller and callee need to use the same memory locations for the arguments.
yeh, i think we should just make the frame stack a separate data structure that lives inside the vCPU, not directly accessible.

sp -> | arg1      |
      | arg2      |
fp -> | prev fp   |




