The basics of the CPU emulator core are in place; there are still *tons* of opcodes left to implement but they're mostly trivial. The "hard" stuff (call stack management) is done, and seems to be working.

Main task for next stream is to get some graphics output working so there's something to actually see.

After that, get a Zig/WASM harness in place, and port the emulator to Zig.

# Deferred

  - rework registers to be 7 bits
