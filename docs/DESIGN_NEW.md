# Overview

  - 256KiB total RAM, organised into 32 banks of 8KiB
  - RAM banks are mapped into 16-bit (64KiB) address space
    - first 16KiB always maps to banks 0 and 1
    - remaing 48KiB (6 banks) can be mapped to any physical bank
  - External 4KiB data stack for locals and arguments
  - External 1KiB frame stack for function calls
  - Graphics capabilities:
    - framebuffer can be mapped into address space and manipulated directly, OR...
    - GPU can do "hardware" blitting, with access to the full 256KiB

# Hardware Implementations

  - Target system: ESP32
  - Stretch goal: implement on FPGA

# Execution

Execution begins from address 0 and continues until a HALT instruction is executed.

Calling a function pushes a frame and sets the base pointer to point at the first argument.
Local variables are stored on a access is always relative to the base pointer.

# Instructions

Instructions are all encoded with 4 bytes; first byte is always the opcode.

[Instruction Set Google Sheet](https://docs.google.com/spreadsheets/d/1TSFjvukii5MzUIKGg3EUjjwCWSFNfceQ0CGCDAwPIgI/edit?usp=sharing)
