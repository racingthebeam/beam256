#include "beam256/internals.h"
#include <string.h>

static void init_reg(machine_t *m);
static void init_mem(machine_t *m);
static int tick(machine_t *m);

void machine_init(machine_t *m, uint8_t *mem, machine_event_fn on_event) {
    m->mem = mem;
    m->on_event = on_event;

    memset(m->reg, 0, sizeof(WORD) * REG_MAX);

    memset(m->stack, 0, sizeof(WORD) * STACK_WORDS);
    m->sp = 0;

    memset(m->frames, 0, sizeof(frame_t) * FRAME_STACK_SIZE);
    m->fp = 0;

    m->halted = 0;

    init_reg(m);
    init_mem(m);
}

int machine_run(machine_t *m, int ncycles) {
    int cyc = 0;
    while (!m->halted && ncycles--) {
        cyc++;
        if (tick(m) != 0) {
            break;
        }
    }
    return cyc;
}

static void init_reg(machine_t *m) {
    m->reg[REG_GRAPHICS_FRAMEBUFFER_ADDR] = 0xC000;
    m->reg[REG_GRAPHICS_PALETTE_ADDR] = 0xFFC0;
    m->reg[REG_GRAPHICS_MODE] = 0;
}

static void init_mem(machine_t *m) {
    int wp, end;

    printf("init memory: %p\n", m->mem);

    int c = 0;
    wp = m->reg[REG_GRAPHICS_FRAMEBUFFER_ADDR];
    end = wp + (160 * 200) / 2;
    while (wp < end) {
        uint8_t col1 = (c++) & 0x0F;
        uint8_t col2 = (c++) & 0x0F;
        m->mem[wp++] = col1 | (col2 << 4); // this'll do for now
    }

#define PAL_ENT(r, g, b) do { \
    m->mem[wp++] = r >> 2; \
    m->mem[wp++] = g >> 2; \
    m->mem[wp++] = b >> 2; \
    m->mem[wp++] = 0; \
} while(0)

    wp = m->reg[REG_GRAPHICS_PALETTE_ADDR];
    PAL_ENT(0x0F, 0x0E, 0x00);
    PAL_ENT(0x18, 0x24, 0x03);
    PAL_ENT(0x13, 0x37, 0x07);
    PAL_ENT(0x0A, 0x4A, 0x14);
    PAL_ENT(0x12, 0x5F, 0x3E);
    PAL_ENT(0x1D, 0x72, 0x6F);
    PAL_ENT(0x28, 0x63, 0x85);
    PAL_ENT(0x38, 0x4F, 0x9B);
    PAL_ENT(0x59, 0x48, 0xAD);
    PAL_ENT(0x91, 0x58, 0xBC);
    PAL_ENT(0xC4, 0x6D, 0xC7);
    PAL_ENT(0xD3, 0x87, 0xB7);
    PAL_ENT(0xDC, 0x9F, 0xAE);
    PAL_ENT(0xE8, 0xBF, 0xB7);
    PAL_ENT(0xF6, 0xE9, 0xD7);
    PAL_ENT(0xFD, 0xFD, 0xF2);

#undef PAL_ENT

    // We'll just bodge this in here for now
    m->on_event(EV_GRAPHICS_REQUEST_DRAW, 0);
}

#define OP(ins) ((ins) >> 24)

#define DECODE_REG_REG(ins, r0, r1) \
    uint8_t r0 = (((ins) >> 16) & 0xFF); \
    uint8_t r1 = (((ins) >> 8) & 0xFF)

static int tick(machine_t *m) {
    frame_t *f = &m->frames[m->fp];
    WORD ins = mem_read_uint32_le(m->mem + f->ip);
    f->ip += 4;

    switch (OP(ins)) {
        case OP_MOV:
        {
            DECODE_REG_REG(ins, rd, rs);
            m->stack[m->sp + rd] = m->stack[m->sp + rs];
            break;
        }
        case OP_HALT:
            m->halted = 1;
            break;
    }

    return 0;
}
