#include "beam256/beam256.h"

int beam256_init() {
    return 0;
}

int beam256_init_machine(machine_t *m, uint8_t *mem) {
    machine_init(m, mem);
    return 0;
}

int beam256_tick(machine_t *m, int ncycles) {
    return machine_run(m, ncycles);
}

int beam256_is_halted(machine_t *m) {
    return m->halted;
}

WORD beam256_read_reg(machine_t *m, int reg) {
    return m->reg[reg];
}

