#pragma once

#include <stdio.h>
#include <stdint.h>

typedef uint32_t WORD;

#define MEMORY_SIZE         (256 * 1024)
#define STACK_WORDS         512
#define FRAME_STACK_SIZE    32

// Registers
enum {
    REG_INVALID,
    REG_GRAPHICS_FRAMEBUFFER_ADDR,
    REG_GRAPHICS_PALETTE_ADDR,
    REG_GRAPHICS_MODE,
    REG_MAX
};

typedef struct frame {
    int ip;
    int bp;
    int nargs;
} frame_t;

typedef struct machine {
    // system memory
    uint8_t *mem;

    // register file
    WORD reg[REG_MAX];

    // stack + stack pointer
    WORD stack[STACK_WORDS];
    int sp;

    // callstack
    frame_t frames[FRAME_STACK_SIZE];
    int fp;

    int halted;
} machine_t;

void machine_init(machine_t *m, uint8_t *mem);
int machine_run(machine_t *m, int ncycles);
