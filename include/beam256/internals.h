#pragma once

#include <stdio.h>
#include <stdint.h>

#include "beam256/opcodes.h"

typedef uint32_t WORD;

typedef void (*machine_event_fn)(uint32_t event, uint32_t arg1, uint32_t arg2);

typedef WORD (*bif_fn)(WORD *args, int nargs);

enum {
    BIF_TEST,
    BIF_MAX
};

// TODO: work out a better way to set up this table
extern bif_fn bif_table[BIF_MAX];

#define MEMORY_SIZE         (256 * 1024)
#define STACK_WORDS         512
#define FRAME_STACK_SIZE    32

// IO ports
enum {
    REG_INVALID,
    REG_GRAPHICS_FRAMEBUFFER_ADDR,
    REG_GRAPHICS_PALETTE_ADDR,
    REG_GRAPHICS_MODE,
    REG_GRAPHICS_DRAW,
    REG_MAX
};

// Events to pass back to host
enum {
    // TODO: bit of confusion here
    // Do we pass the RAW events (i.e. register written) back to the host, and
    // let it work out what to do? Or do we pass back semantic events, like a
    // draw request? Can see pros and cons to either approach... we'll just
    // let it play out
    EV_IO_WRITE,
    EV_GRAPHICS_REQUEST_DRAW,
};

typedef struct frame {
    int ip;
    int bp;
    int nargs;
    uint8_t r_dst;
} frame_t;

typedef struct machine {
    // system memory
    uint8_t *mem;

    // event handler
    machine_event_fn on_event;

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

void machine_init(machine_t *m, uint8_t *mem, machine_event_fn on_event);
int machine_run(machine_t *m, int ncycles);

uint32_t mem_read_uint32_le(uint8_t *mem);
uint16_t mem_read_uint16_le(uint8_t *mem);
void mem_write_uint32_le(uint8_t *dst, uint32_t val);
void mem_write_uint16_le(uint8_t *dst, uint16_t val);

