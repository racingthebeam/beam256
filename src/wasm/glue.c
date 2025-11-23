#include "beam256/beam256.h"

#include <stdio.h>
#include <stdlib.h>

// Simple glue API that exposes a single BEAM256 machine
// instance to WASM.

static machine_t machine;
static uint8_t memory[MEMORY_SIZE];

int init() {
    beam256_init();
    return beam256_init_machine(&machine, memory);
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

