#pragma once

#include "beam256/internals.h"

//
// Public API for embedding a BEAM256 emulator in a host application.

/*
 * Initialise the BEAM256 library
 *
 * Returns 0 on success
 */
int beam256_init();

/*
 * Initialise a BEAM256 machine
 *
 * `mem` must be at least 256KiB
 *
 * Returns 0 on success.
 */
int beam256_init_machine(machine_t *m, uint8_t *mem, machine_event_fn on_event);

/*
 * Tick the given machine for up to the given number of cycles
 *
 * The number cycles executed may be less than requested if the machine halts
 * or some other interrupt occurs that requires immediate handling.
 */
int beam256_tick(machine_t *m, int ncycles);

/*
 * Check if the given machine is halted.
 *
 * Returns 1 if halted, 0 otherwise.
 */
int beam256_is_halted(machine_t *m);

/*
 * Read the given register from the machine
 */
WORD beam256_read_reg(machine_t *m, int reg);

/*
 * Write the given register to the machine
 * Returns the previous value
 */
WORD beam256_write_reg(machine_t *m, int reg, WORD value);
