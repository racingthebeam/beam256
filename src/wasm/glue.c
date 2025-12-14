#include "beam256/beam256.h"

#include <emscripten.h>
#include <stdio.h>
#include <stdlib.h>

// Simple glue API that exposes a single BEAM256 machine
// instance to WASM.

static machine_t machine;
static uint8_t memory[MEMORY_SIZE];

int init(machine_event_fn on_event) {
    beam256_init();
    return beam256_init_machine(&machine, memory, on_event);
}

uint8_t* ram_base() {
    return memory;
}

int tick(int ncycles) {
    return beam256_tick(&machine, ncycles);
}

int is_halted() {
    return beam256_is_halted(&machine);
}

WORD read_reg(int reg) {
    return beam256_read_reg(&machine, reg);
}

SWORD read_reg_signed(int reg) {
    union { int32_t i; uint32_t u; } out;
    out.u = read_reg(reg);
    return out.i;
}

WORD write_reg(int reg, WORD value) {
    return beam256_write_reg(&machine, reg, value);
}

