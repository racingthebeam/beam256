#include "beam256/internals.h"
#include <string.h>

static void init_reg(machine_t *m);
static void init_mem(machine_t *m);
static int tick(machine_t *m);

void machine_init(machine_t *m, machine_opts_t *opts) {
    m->mem = opts->memory;
    m->dst = opts->debug_string_table;
    m->dst_size = opts->debug_string_table_size;
    m->on_event = opts->on_event;
    m->on_print = opts->on_print;
    m->on_io_read = opts->on_io_read;
    m->on_io_write = opts->on_io_write;

    memset(m->mem, 0, MEMORY_SIZE);

    // Test only - put stack at 128KiB
    m->stack = (WORD*)(m->mem + (128 * 1024));
    m->sp = 0;

    // Test only - put frame stack at 192KiB
    m->frames = (frame_t*)(m->mem + (192 * 1024));
    m->fp = 0;

    m->halted = 0;
}

int machine_run(machine_t *m, int ncycles) {
    int cyc = 0;
    while (!m->halted && ncycles--) {
        cyc++;
        if (tick(m) == 0) {
            break;
        }
    }
    return cyc;
}

static void dbg_dump_stack(machine_t *m) {
    printf("=== stack ===\n");
    printf("sp=%d\n", m->sp);
    for (int i = 0; i < m->sp; i++) {
        printf("%d: %d\n", i, m->stack[i]);
    }
    printf("=== end stack ===\n");
}

#define OP(ins)         ((ins) >> 24)

#define UNUSED_REG      0x3F
#define UNUSED_REGISTER UNUSED_REG

#define REG(r)          (m->stack[f->bp + (r)])
#define SET_REG(r, v)   (m->stack[f->bp + (r)] = (v))

#define PUSH(v)         (m->stack[m->sp++] = (v))
#define POP()           (m->stack[--(m->sp)])
#define POPN(n)         (m->sp -= (n))

#define REL_JMP_PRE_DEC(f, reg) \
    if ((f) & 0b10) { SET_REG(reg, REG(reg) - 1); }

#define REL_JMP_POST_INC(f, reg) \
    if ((f) & 0b01) { SET_REG(reg, REG(reg) + 1); }

// Relative jumps are specified in terms of instructions...
#define JMP_REL(rel)    (f->ip += (rel << 2))

// ...whereas absolute jumps are byte offsets
// (this is because absolute jump offsets may originate from
// registers, possibly by taking address of a label. dont' want
// to burden programmer with understanding difference between
// instructions and byte offsets)
#define JMP_ABS(abs)    (f->ip = (abs))

#define FLAG_MEMX_SIGN_EXTEND   1
#define FLAG_MEMX_INC           2

#define PRINT_BUFFER_SIZE 256
static char print_buffer[PRINT_BUFFER_SIZE];

static void print(machine_t *m, int idx, int vc, WORD v1, WORD v2) {
    uint16_t offset = mem_read_uint16_le(m->dst + (idx * 2));
    char *str = (char*)m->dst + offset;

    int written;
    switch (vc) {
        case 0: written = snprintf(print_buffer, PRINT_BUFFER_SIZE, str); break;
        case 1: written = snprintf(print_buffer, PRINT_BUFFER_SIZE, str, v1); break;
        case 2: written = snprintf(print_buffer, PRINT_BUFFER_SIZE, str, v1, v2); break;
    }

    m->on_print(print_buffer, MIN(written, PRINT_BUFFER_SIZE - 1));
}

static int tick(machine_t *m) {
    // TODO: f->ip should be instruction-indexed, not byte-indexed, where possible
    // This will only work on architectures where the native byte order is LE.
    // I think this is true of x86_64 and arm64, and the RP2350.

    frame_t *f = &m->frames[m->fp];
    WORD ins = mem_read_uint32_le(m->mem + f->ip);
    f->ip += 4;

    int keep_ticking = 1;

#define HALT()          (m->halted = 1)
#define START_OP(name)  case name: {
#define END_OP()        break; }
#define RSV(n)          (m->sp = f->bp + (n))
#define BREAKPOINT()    0

    switch (OP(ins)) {
        #include "ops/all.inc.c"
        default:
            printf("UNKNOWN INSTRUCTION: %d\n", OP(ins));
            // TODO: we should probably fire an event here
            HALT();
            break;
    }

#undef BREAKPOINT
#undef RSV
#undef END_OP
#undef START_OP
#undef HALT

    return keep_ticking;
}

