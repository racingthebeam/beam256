#include "beam256/beam256.h"

#include <emscripten.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Simple glue API that exposes a single BEAM256 machine
// instance to WASM.

#define PRINT_BUFFER_SIZE 2048

static machine_t machine;
static uint8_t memory[MEMORY_SIZE];
static uint8_t dst[DEBUG_STRING_TABLE_SIZE];

static char print_buffer[PRINT_BUFFER_SIZE];

typedef void (*glue_print_fn)(const char *str, int len);

static glue_print_fn _on_print;

static void on_print_int(const char *msg, int len) {
    // FIXME: lazy
    if (len > PRINT_BUFFER_SIZE) {
        return;
    }
    memcpy(print_buffer, msg, len);
    _on_print(print_buffer, len);
}

int init(glue_print_fn on_print, machine_event_fn on_event, machine_io_read_fn on_io_read, machine_io_write_fn on_io_write) {
    beam256_init();

    _on_print = on_print;

    machine_opts_t opts;
    opts.memory = memory;
    opts.debug_string_table = dst;
    opts.debug_string_table_size = DEBUG_STRING_TABLE_SIZE;
    opts.on_print = on_print_int;
    opts.on_event = on_event;
    opts.on_io_read = on_io_read;
    opts.on_io_write = on_io_write;

    return beam256_init_machine(&machine, &opts);
}

uint8_t* ram_base() { return memory; }

uint8_t* debug_string_table_base() { return dst; }
int debug_string_table_size() { return DEBUG_STRING_TABLE_SIZE; }

int tick(int ncycles) {
    return beam256_tick(&machine, ncycles);
}

int is_halted() {
    return beam256_is_halted(&machine);
}

WORD read_reg(int reg) {
    return beam256_read_reg(&machine, reg);
}

UWORD read_reg_unsigned(int reg) {
    union { int32_t i; uint32_t u; } out;
    out.i = read_reg(reg);
    return out.u;
}

WORD write_reg(int reg, WORD value) {
    return beam256_write_reg(&machine, reg, value);
}

