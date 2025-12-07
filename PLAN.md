# PLAN

This is the high-level development plan; for more detail check the docs folder!

## [ ] ISA, CPU Core + Emulator

  - design ISA v1
  - minimum viable assembler to turn text into RAM image
  - implement all opcodes and test
  - support basic framebuffer output in browser emulator

## [ ] Hardware Prototype

  - decide on HW platform; choose & order components
  - build prototype/devkit
  - set up project + build workflow
  - get core running on hardware
  - get graphics output working
  - get sound output working

## [ ] Iterate

  - iterate on ISA design, emulator + HW implementations
  - focus on machine functionality (not surrounding features like code loading)
  - examples: timers, button input, accelerated blitting, memory management unit
  - also in scope: streaming extra data from storage, save-state (e.g. high score, saved games)
  - audio is out of scope

## [ ] Real Assembler

  - write spec for assembly language
  - migrate entire dev toolchain to TypeScript, split up into libraries as appropriate
  - full ASM implementation - labels, constants, includes, maybe expressions

## [ ] Audio

  - design audio system + implement

## [ ] Hardware Design

  - PCB design
  - 3D enclosure design
  - Send for manufacture

## [ ] Development Environment

  - Build browser-based development environment
  - Build CLI tools for asset generation
  - Consider porting assembler to Go (can it run on WASM?)
  - Plugin architecture/build system for browser dev

## [ ] Firmware Supervisor

  - Game list (from SD card?)
  - Graphical menu
  - Reset button

## [ ] Cloud Dev Env

  - Get the dev env into a state where it can be hosted on the cloud
  - Build cloud arch (server(less), DB, auth etc)
  - Deploy automation (Terraform etc)
  - Proper web design
