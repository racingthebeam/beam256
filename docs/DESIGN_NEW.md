## Graphics & Framebuffer

BEAM256 supports the following display modes:

  - 320x200 @ 4bpp (32,000 bytes)
  - 160x200 @ 4bpp (16,000 bytes)
  - 160x200 @ 8bpp (32,000 bytes)

The resolution for each of these modes is the maximum, there's no reason why we shouldn't allow users to select a lower resolution (maybe have a bunch of presets rather than arbitrary dimensions?)

For the actual hardware, target display is 240x320. Extra 40px can be for the system status bar or something, or maybe we should just up the resolution to 320x240? I did like the idea that each resolution fits nicely into some multiple of 8KiB - going up to 320x240 blows this out the water. On the other hand, it seems a bit dumb to deliberately design a device such that all its display modes leave a black band across the top/bottom of the display.

### Framebuffer

The framebuffer is located at an arbitrary point in BEAM256's 256KiB of RAM, set via register. Because the "GPU" has access to the full 256KiB, the framebuffer can be situated outside of CPU-addressable memory, leaving 64KiB of non-graphics data addressable by the CPU.

We *might* need to enforce that the framebuffer is aligned to some sort of boundary but only if that makes the hardware implementation noticably faster. At the very least we should probably ensure that the framebuffer doesn't wrap around at the 256KiB boundary, otherwise every memory access operation will require a mask. Worry about that when we get there...

### Palette

BEAM256's palette is _cautiously_ 18bpp (6 bits per R, G, B channel). If that's too slow for updating the display over SPI at a decent refresh rate we might need to drop down to 16bpp.

The palette is stored in main memory, represented as an array of 4-byte entries in R, G, B order; the 4th entry is blank (4 byte alignment will make the maths faster when computing offsets). Accordingly, in 4bpp mode, the palette occupies 64 bytes; in 8bpp mode, 1024 bytes.

The palette base address must be 4-byte aligned.

### Register Controls

We'll need the following controls, we'll try to keep all the mode settings in a single one-word register so that updates will always be atomic.

  - `REG_GRAPHICS_FRAMEBUFFER_ADDR`: framebuffer byte address
  - `REG_GRAPHICS_PALETTE_ADDR`: palette byte address
  - `REG_GRAPHICS_MODE`
    - `31:24` - `line_stride / 2` (in bytes) (0 == auto, tightly packed)
    - `23:16` - `height / 2` (0 == native)
    - `15:8` - `width / 2` (0 == native)
    - `6:2` - unused
    - `1:1` - palette size (0 = 4bpp, 1 = 8bpp)
    - `0:0` - screen size (0 = 160x200, 1 = 320x200)

### Reset

At reset, BEAM256 is in the following mode:

  - Screen size: 160x200
  - Palette: 4bpp
  - Framebuffer located at `0xC000`
  - Default palette located at `0xFFC0`

### GPU Instructions

BEAM256 is designed to be implemented on a dual-core microcontroller such as the ESP32 or RP2040, or even on an FPGA. The second core will be dedicated to graphics and audio, and any spare cycles will be used to implement accelerated operations; some ideas for the future:

  - rectangular bit-blit with transparency
  - indexed sprite sheets (like the Gameboy, perhaps even with a background-tile layer)
  - maybe even drawing primitives like lines, text etc (can take inspiration from the FT800 EVE series of ICs)

The "GPU" will always be an optional feature - should be possible to make games just by mapping the framebuffer into RAM and manipulating it directly.

A thought - we could have an instruction for writing to the framebuffer __without__ mapping it into memory; maybe a "data copy register" or something - use an IO instruction that automatically writes data to the memory location pointed to by the DRC and auto-increments? Could even have a couple of additional registers for controlling stride/boundaries etc. A kind of in-process blit. Yeh, we'll revisit this...
