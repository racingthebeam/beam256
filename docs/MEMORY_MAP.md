# Memory Map

Execution begins from address 0.
How do we work out where the heap starts?

right so... the challenge we have is that we want to support a bunch of different graphics modes (with a wide variety of memory requirements), so a fixed memory map is going to be troublesome for the programmer.

i think the best way to deal with this is just to... not deal with it. the compiler/assembler can work out how big everything is, and maybe we can have some directives to fill in absolute values, i dunno, never built an assembler or linker before. regardless, punt it into the future.


