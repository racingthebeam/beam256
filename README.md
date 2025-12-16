# BEAM256

BEAM256 is a work-in-progress fantasy console that is being [developed live on Twitch](https://www.twitch.tv/racingthebeam). The goal is to create an ISA, embedded hardware implementation, and a suite of browser-based dev tools (including emulator). An FPGA implementation is a distant stretch goal.

Overview:

  - 256KB RAM + external stack
  - 320x200 (2 + 4bpp) and 160x200 (2 + 4 + 8bpp) palettised graphics modes
  - framebuffer and palette reside in RAM
  - banked memory (64KB addressable at any given time)
  - "hardware" accelerated drawing operations

Target platform will be either ESP32 or RP2040. I'd like to get WiFi on there for ease of loading games, plus this would allow the device to host its own dev environment.

Audio functionality is TBC and will likely be punted down the road until we have a working MCU version so we know what the available CPU budget is.

## Project Layout

  - `asm/`: assembler (JavaScript)
  - `src/`: C source code, including VM, HW-specific code, and WASM interop
  - `emu/`: emulator (JavaScript)

## Dependencies

  - Emscripten (`emcc`)

## Resources

  - [Design](./docs/DESIGN.md) - design document; a bit of a mess right now
  - [Devlog](./docs/DEVLOG.md) - this is a record of what's worked on each stream
  - [Instruction Set](https://docs.google.com/spreadsheets/d/1TSFjvukii5MzUIKGg3EUjjwCWSFNfceQ0CGCDAwPIgI/edit?gid=0#gid=0)
  - [References](./docs/REFERENCE_NOTES.md) - write ups on things I've taken inspiration from (e.g. CHIP8, CHIP16)
  - [Ramblings](./docs/RAMBLINGS.md) - random thoughts that occur during livestreams; very likely to be out of date and incongruous with the current state of the project
