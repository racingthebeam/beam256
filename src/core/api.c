#include "beam256/beam256.h"

int beam256_init() {
    return 0;
}

int beam256_init_machine(machine_t *m, uint8_t *mem, machine_event_fn on_event) {
    machine_init(m, mem, on_event);
    return 0;
}

int beam256_tick(machine_t *m, int ncycles) {
    return machine_run(m, ncycles);
}

int beam256_is_halted(machine_t *m) {
    return m->halted;
}

WORD beam256_read_reg(machine_t *m, int reg) {
    return m->stack[m->frames[m->fp].bp + reg];
}

WORD beam256_write_reg(machine_t *m, int reg, WORD value) {
    WORD out = m->stack[m->sp + reg];
    m->stack[m->sp + reg] = value;
    return out;
}

