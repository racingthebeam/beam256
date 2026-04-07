## 2026-03-14 (SAT, D31)

  - Simple UI skeleton
    - [x] TS widget system
    - [x] text editor
    - [x] local storage
    - [x] toolbar
    - [x] Go toolchain skeleton, imported via WASM, with IO interface
    - [x] Make a webworker Go assembly service thingy

## 2026-03-15 (SUN, D32)

  - Emulator skeleton
    - [x] emulator trigger workflow (UI)
    - [x] button input
    - [x] offscreen canvas
    - [x] bitmap renderer
    - [x] some audio tests

## 2026-03-21 (SAT)

  - Make it pretty
    - [x] bring in CSS theme from my previous attempt at building this
    - [x] improve the widget system architecture

## 2026-03-22 (SUN)

  - [x] Quick architecture review
  - [x] Design linker syntax
  - [x] Design assembler syntax
  - [x] Final set of initial opcodes documented in a spreadsheet

## ~2026-03-29

  - [x] Implement assembler+linker toolchain in Go
  - [x] JSON interface between IDE and toolchain

## ~2026-4-04

  - [x] Implement final opcodes in vCPU core
  - [x] Fix up tests

!STOP

## 2026-04-11

  - [ ] Emulator integration - toolchain, load, run, debug print in main thread
  - [ ] Drag and drop image file from local machine (need a basic Goblin file implementation too)
  - [ ] Fix editor scrolling
  - [ ] Display finalisation; test all render modes in canvas
  - [ ] Switch instruction pointer to be instruction-indexed, update jump/call etc. (JMPA will need alignment check)
  - [ ] Toolchain - image generation, palette generation
  - [ ] Find a simple tileset

## 2026-04-18

  - [ ] Peripheral: counter
  - [ ] Peripheral: RNG
  - [ ] Peripheral: time
  - [ ] Emulator integration - iterate until we can use buttons to move an animated sprite around the screen

## Fun opcodes (BLITx, MEMCPY etc, RND)

## Save data

## Audio engine

  - Implement multi-channel audio system
    - define features
    - IO port map
  - Implement sequencer engine
  - WASM build of audio engine for use in emulator, integrate

## IDE - multi-file, help system, docs, debug mode

## IDE - backend, user accounts, save/load projects

## IDE - plugin system

## IDE - publish projects, project gallery, user profiles

## IDE - polish, changelog

## Firmware - supervisor, SD card, serial loading, audio driver, other peripherals

  - USB mass storage mode for loading games
  - USB serial interface skeleton for debugger (no actual debugger implementation, just lay the groundwork for it while we're doing the USB stuff anyway)

## Home screen - inc. SVC support

  - Add homescreen "app" to device
  - Read game index from SD card
  - Exported file contents from IDE should include metadata inc. icon (PICO-8 style PNG approach?)
  - Launch games from homescreen

## GPU

## Battery board + F/W integration

## PCB design and testing

## Case design / iteration

## Debugger

## Marketing website

# DEFERRED

  - Toolchain needs better error messages (including line/column)
  - Pointer to registers (&xx syntax), direct memory copy opcodes
  - Rewrite emulator canvas graphics output to use shaders
  - Fix RGB565 -> RGB888 colourspace expansion
  - Write syntax highlighting mode/theme for CodeMirror
  - Timing parity between emulator and hardware

