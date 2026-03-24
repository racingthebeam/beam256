# Built-in Functions

We need to think about how we'll implement these on a future FPGA implementation - do we have dedicated hardware for each, or do we have a sidecar CPU?

It might be worth organising the BIFs into logical "banks" that can be selectively enabled/disabled - this could be fun for games jams.

## Ideas

  - Memory operations: copy, fill
  - Maths: min, max, clamp, lerp (signed/unsigned)
  - Fixed point maths
  - Trig functions (fixed-point)
  - Trig LUT generation
  - Font generation (copies named font from flash/ROM to console RAM)
  - Text blitting
  - Sprite blitting
  - Primitive drawing
  - SFX generation (give it a bunch of args and it writes audio data out to RAM)
  - Random number generation
  - String operations
  - Array-list operations
  - Wall-clock time (sleep, get time)
