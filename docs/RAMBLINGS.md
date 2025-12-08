# WASM stuff

Need to reproduce the working framebuffer we had from last session, but having WASM initialise the machine state, then have JS read the relevant registers and memory in order to present the framebuffer.


# Assembler Thoughts

Tokenizer and parser are working well.
Need to write some unit tests
Need a proper TypeScript project setup, will do this off-stream coz it's fucking boring.

Need to work out how we handle labels; specifically, how do we keep track of where they point.
Currently we're parsing the ASM file into what's basically an AST; the problem with this is that labels have nothing to point to. Options:

  1. map of labels, each one points to the length of the program array at the time the label was created
  2. each label is itself an entry in the program array
  3. do both; label is inserted into the program array, and an auxiliary map maps labels to these indices.

I'll do 3.

--

# Offstream Thoughts

  - can we implement flags efficiently on the target architecture(s)? (ARM, perhaps RISC-V)
    - ideally, our C-based vCPU would just copy the flags out of the host CPU
    - if this isn't possible we might need to lose the feature since it will absolutely kill performance.
    - should probably rethink the comparison/jmp op set so there's a minimal set that don't rely on the flag register
    - we should probably also have a bit on math/bitwise ops that controls whether the flag registers are updated (like in the Z80)
  - i think i want the device to have 128KiB of RAM instead of the previous 64 - will allow for higher-resolution framebuffer. unfortunately this means the simple instruction encoding of (op:u8, reg:u8, addr:u16) no longer works; instead we need to change register numbers to 7-bit allowing us to expand to 17 bits for literal memory addresses. would rather not reduce the size of opcodes since we already have a lot of ops and that's before we've even got to IO. AND we're going to have to double the number of math/bitwise ops so we can control whether the flag register is updated
- this autocompletion popup is annoying

--

64KiB yeh?

We haven't decided on a display size yet. Lets do some napkin maths..

| Width | Height | Bytes @ 8bpp | Bytes @ 4bpp |
|-------|--------|--------------|--------------|
| 320   | 240    | 76,800       | 38,400       |
| 320   | 200    | 64,000       | 32,000       |
| 160   | 120    | 19,200       |  9,600       |

this all looks pretty reasonable - 9,600 bytes for the lowest resolution
with 16 colours on screen is enough to do pretty good stuff. and we can
allow the choice of higher resolutions, at the expense of RAM.
I am now wondering if we should switch to 128KiB... ho hummm....

  - physical display is 320x240
  - graphics modes are:
    - 320x240
    - 320x200
    - 160x200
    - 160x120

Assuming we're using an RP2040 it should be no problem to use the second core
to do some DMA/pixel doubling trickery.

# Stack Location

I've reached a design impasse :/

Original plan was for *everything* to reside in the main 64/128K of RAM - instructions, frame buffer, stack (including necessary housekeeping structures for call/return). This can be done, but it just doesn't seem *fun* for the average user. It requires people to *care* about where the stack is located, and be aware that it needs to be placed optimally based on the framebuffer configuration. This might sound fun to an embedded programmer but I'm worried that most might just find it annoying.

Modern CHIP8 implementations store the stack outside of the accessible 4K of RAM; this design is *much* easier to implement and work with, but I can't help but think that it feels like cheating in some way (the stack in BEAM256 is more powerful, akin to the Lua VMs register file which acts as an addressable store for local variables).

So the question is - purity vs simplicity.

think we'll go simple!




class Frame {
    // ip - address of next instruction to be executed (absolute offset into main memory)
    // bp - frame's base stack pointer, from which all
    //      register references are relative.
    //      bp is an entry index (each entry is 1 word/4 bytes)
    // nargs - number of arguments that were supplied to this frame.
    constructor(ip, bp, nargs) {
        this.ip = ip;
        this.bp = bp;
        this.nargs = nargs;
        this.sp = this.bp + this.nargs;
    }
}

the one problem with this arrangement is that it doesn't allow for variadic functions, since args and locals share the same address space... or wait... hang on?

you need to use the RSV opcode to reserve space for locals

pseudocode for RSV:

for i = 0; i < nlocals; i++ {
    PUSH 0
}

if we just said, RSV's operand should be (max args + nlocals), this means you'll end up with consistent stack layout regardless. it's only slightly more onerous for the programmer, and avoids doing strange negative-indexing tricks for arguments.
we can add an NARGS opcode that returns the number of arguments that were passed to the current frame.
is RSV is invoked with a value < nargs, that's a hard fault.

# JavaScript?!

Really feel like doing the core machine emulator in JS is a complete waste of time.
WASM is a thing and it would be far easier to do all the bit juggling in Zig or similar.
JS is still fine (and indeed, necessary) for the host environment, since we want the thing to run in a browser. But the core should really be in something else. I think we'll get the bare minimum up and running in JS then switch to Zig or similar.


# Function Calling

BCALL (built in function call) puts return value into a designated register.

for CALL, we can do this:

  - CALL r_dst, r_fn, nargs (7 + 7 + 5 = 19)
  - CALL r_dst, addr, nargs (7 + 16 + 5 = 28 - TOO MANY)

Some thoughts:

  - if calling by immediate address, the return value remains on the stack
    - this "works" but it's inconsitent with everything else
  - we could just not allow calling by immediate address; the problem here
    is that every call now requires a MOV before. cycles matter in this little machine :)
  - in general, for CALL, we could expand max # of args to 127
    - why? because it would allow us to pass small arrays on the stack
    - (we're going to add a few index-based MOV opcodes for dealing with stack arrays)

So we arrive at this:

  - CALL r_dst(7), r_fn(7), nargs(7)
  - CALL addr(16), nargs(7)

With the latter form leaving the return value on the stack.

Actually wait.
When control passes to the callee, we lose the context for where the return value is to go.
So if we want to be able to write the return value directly to a register there's going to need to be some information stored in the stack frame to instruct the machine where to write it. Don't know if I like this.








