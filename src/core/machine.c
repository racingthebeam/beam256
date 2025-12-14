#include "beam256/internals.h"
#include <string.h>

static void init_reg(machine_t *m);
static void init_mem(machine_t *m);
static int tick(machine_t *m);
static WORD read(machine_t *m, uint8_t port);
static int write(machine_t *m, uint8_t port, WORD value);

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

    memset(mem, 0, MEMORY_SIZE);
    init_mem(m);
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

static void init_reg(machine_t *m) {
    m->reg[REG_GRAPHICS_FRAMEBUFFER_ADDR] = 0xC000;
    m->reg[REG_GRAPHICS_PALETTE_ADDR] = 0xFFC0;
    m->reg[REG_GRAPHICS_MODE] = 0;
}

static void init_mem(machine_t *m) {
    int wp, end;

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
    // m->on_event(EV_GRAPHICS_REQUEST_DRAW, 0, 0);
}

#define OP(ins)         ((ins) >> 24)
#define XOP(ins)        ((ins) >> 28)

#define REG(r)          (m->stack[f->bp + (r)])
#define PUSH(v)         (m->stack[m->sp++] = (v))
#define POP()           (m->stack[--(m->sp)])
#define POPN(n)         (m->sp -= (n))

#define FLAG_MEMX_SIGN_EXTEND   1
#define FLAG_MEMX_INC           2

#define DEF_SIGNED_UNION_WITH_UNSIGNED(var, val) \
    union { SWORD i; WORD u; } var; \
    var.u = (val)

#define DEF_SIGNED_UNION_WITH_SIGNED(var, val) \
    union { SWORD i; WORD u; } var; \
    var.i = (val)

#define DECODE_REG(ins, r0) \
    uint8_t r0 = (((ins) >> 16) & 0x7F)

#define DECODE_REG_REG(ins, r0, r1) \
    uint8_t r0 = (((ins) >> 16) & 0x7F); \
    uint8_t r1 = (((ins) >> 8) & 0x7F)

#define DECODE_REG_S17(ins, r0, v0) \
    uint8_t r0 = (((ins) >> 17) & 0x7F); \
    uint32_t v0 = (ins) & 0x1FFFF; \
    if (v0 & 0x10000) v0 |= 0xFFFF0000

#define DECODE_S17(ins, v0) \
    uint32_t v0 = (ins) & 0x1FFFF; \
    if (v0 & 0x10000) v0 |= 0xFFFF0000

#define DECODE_REG_U16(ins, r0, v0) \
    uint8_t r0 = (((ins) >> 16) & 0x7F); \
    uint32_t v0 = (ins) & 0xFFFF

#define DECODE_U16(ins, v0) \
    uint32_t v0 = (ins) & 0xFFFF

#define DECODE_U8_U16(ins, v0, v1) \
    uint8_t v0 = (((ins) >> 16) & 0xFF); \
    uint32_t v1 = ((ins) & 0xFFFF)

#define DECODE_U8_REG(ins, v0, r0) \
    uint8_t v0 = (((ins) >> 16) & 0xFF); \
    uint8_t r0 = (((ins) >> 8) & 0x7F)

#define DECODE_U8_REG_REG(ins, v0, r0, r1) \
    uint8_t v0 = (((ins) >> 16) & 0xFF); \
    uint8_t r0 = (((ins) >> 8) & 0x7F); \
    uint8_t r1 = (((ins) >> 0) & 0x7F)

#define DECODE_REG_REG_REG(ins, r0, r1, r2) \
    uint8_t r0 = (((ins) >> 16) & 0x7F); \
    uint8_t r1 = (((ins) >> 8) & 0x7F); \
    uint8_t r2 = (((ins) >> 0) & 0x7F)

#define DECODE_REG_REG_U10(ins, r0, r1, v0) \
    uint8_t r0 = (((ins) >> 17) & 0x7F); \
    uint8_t r1 = (((ins) >> 10) & 0x7F); \
    uint32_t v0 = (((ins) >> 0) & 0x3FF)

#define DECODE_REG_REG_S10(ins, r0, r1, v0) \
    uint8_t r0 = (((ins) >> 17) & 0x7F); \
    uint8_t r1 = (((ins) >> 10) & 0x7F); \
    int32_t v0 = (((ins) >> 0) & 0x3FF); \
    if (v0 & 0x200) v0 |= 0xFFFFFC00

#define DECODE_REG_U5_U12(ins, r0, v0, v1) \
    uint8_t r0 = (((ins) >> 17) & 0x7F); \
    uint32_t v0 = (((ins) >> 12) & 0x1F); \
    uint32_t v1 = (((ins) >> 0) & 0xFFF)

#define DECODE_F3_U7_U7_U7(ins, f0, v0, v1, v2) \
    uint8_t f0 = (((ins) >> 21) & 0x7); \
    uint8_t v0 = (((ins) >> 14) & 0x7f); \
    uint8_t v1 = (((ins) >> 7) & 0x7f); \
    uint8_t v2 = (((ins) >> 0) & 0x7f)

#define DECODE_F3_U7_U7(ins, f0, v0, v1) \
    uint8_t f0 = (((ins) >> 21) & 0x7); \
    uint8_t v0 = (((ins) >> 14) & 0x7f); \
    uint8_t v1 = (((ins) >> 7) & 0x7f)

#define DECODE_U5_12(ins, r0, v0, v1) \
    DECODE_REG_U5_U12(ins, __ignore__, v0, v1)

static int tick(machine_t *m) {
    frame_t *f = &m->frames[m->fp];
    WORD ins = mem_read_uint32_le(m->mem + f->ip);
    f->ip += 4;

    if (ins & 0x80000000) {
        uint8_t op = ins >> 28;
        uint8_t r_dst = (ins >> 21) & 0x7F;
        uint32_t addr = ((ins >> 7) & 0x3FFF) << 2;
        uint8_t nargs = ins & 0x7F;

        // TODO: check op is valid

        f->r_dst = r_dst;
        m->fp++;
        m->frames[m->fp].ip = addr;
        m->frames[m->fp].bp = m->sp - nargs;
        m->frames[m->fp].nargs = nargs;

        return 1;
    }

    int keep_ticking = 1;

    switch (OP(ins)) {
        case OP_MOV:
        {
            DECODE_REG_REG(ins, rd, rs);
            m->stack[m->sp + rd] = m->stack[m->sp + rs];
            break;
        }
        case OP_MOV_I:
        {
            DECODE_REG_S17(ins, rd, val);
            REG(rd) = val;
            break;
        }
        case OP_MOV_O:
        {
            DECODE_REG_REG_REG(ins, rd, rs, ro);
            REG(rd) = REG(rs + REG(ro));
            break;
        }
        case OP_MOVL:
        {
            DECODE_REG_U16(ins, rd, val);
            uint32_t tmp = REG(rd);
            REG(rd) = (tmp & 0xFFFF0000) | val;
            break;
        }
        case OP_MOVH:
        {
            DECODE_REG_U16(ins, rd, val);
            uint32_t tmp = REG(rd);
            REG(rd) = (tmp & 0x0000FFFF) | (val << 16);
            break;
        }
        case OP_ADD:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) + REG(r2);
            break;
        }
        case OP_ADD_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) + v1;
            break;
        }
        case OP_SUB:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) - REG(r2);
            break;
        }
        case OP_SUB_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) - v1;
            break;
        }
        case OP_MUL:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) * REG(r2);
            break;
        }
        case OP_MUL_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) * v1;
            break;
        }
        case OP_MUL_S:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            DEF_SIGNED_UNION_WITH_UNSIGNED(l, REG(r1));
            DEF_SIGNED_UNION_WITH_UNSIGNED(r, REG(r2));
            DEF_SIGNED_UNION_WITH_SIGNED(result, l.i * r.i);
            REG(rd) = result.u;
            break;
        }
        case OP_MUL_S_I:
        {
            DECODE_REG_REG_S10(ins, rd, r1, v1);
            DEF_SIGNED_UNION_WITH_UNSIGNED(l, REG(r1));
            DEF_SIGNED_UNION_WITH_SIGNED(result, l.i * v1);
            REG(rd) = result.u;
            break;
        }
        case OP_DIV:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) / REG(r2);
            break;
        }
        case OP_DIV_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) / v1;
            break;
        }
        case OP_DIV_S:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            DEF_SIGNED_UNION_WITH_UNSIGNED(l, REG(r1));
            DEF_SIGNED_UNION_WITH_UNSIGNED(r, REG(r2));
            DEF_SIGNED_UNION_WITH_SIGNED(result, l.i / r.i);
            REG(rd) = result.u;
            break;
        }
        case OP_DIV_S_I:
        {
            DECODE_REG_REG_S10(ins, rd, r1, v1);
            DEF_SIGNED_UNION_WITH_UNSIGNED(l, REG(r1));
            DEF_SIGNED_UNION_WITH_SIGNED(result, l.i / v1);
            printf("l.i: %d\n", l.i);
            printf("v: %d\n", v1);
            printf("result: %d\n", result.i);
            REG(rd) = result.u;
            break;
        }
        case OP_MOD:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) % REG(r2);
            break;
        }
        case OP_MOD_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) % v1;
            break;
        }
        case OP_MOD_S:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            DEF_SIGNED_UNION_WITH_UNSIGNED(l, REG(r1));
            DEF_SIGNED_UNION_WITH_UNSIGNED(r, REG(r2));
            SWORD mod = l.i % r.i;
            if (mod < 0) mod += (r.i > 0 ? r.i : -r.i);
            DEF_SIGNED_UNION_WITH_SIGNED(result, mod);
            REG(rd) = result.u;
            break;
        }
        case OP_MOD_S_I:
        {
            DECODE_REG_REG_S10(ins, rd, r1, v1);
            DEF_SIGNED_UNION_WITH_UNSIGNED(l, REG(r1));
            SWORD mod = l.i % v1;
            if (mod < 0) mod += (v1 > 0 ? v1 : -v1);
            DEF_SIGNED_UNION_WITH_SIGNED(result, mod);
            REG(rd) = result.u;
            break;
        }
        case OP_ABS:
        {
            DECODE_REG_REG(ins, rd, r1);
            DEF_SIGNED_UNION_WITH_UNSIGNED(v, REG(r1));
            DEF_SIGNED_UNION_WITH_SIGNED(result, v.i < 0 ? -v.i : v.i);
            REG(rd) = result.i;
            break;
        }
        case OP_NEG:
        {
            DECODE_REG_REG(ins, rd, r1);
            DEF_SIGNED_UNION_WITH_UNSIGNED(v, REG(r1));
            DEF_SIGNED_UNION_WITH_SIGNED(result, -v.i);
            REG(rd) = result.i;
            break;
        }

        case OP_AND:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) & REG(r2);
            break;
        }
        case OP_AND_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) & v1;
            break;
        }
        case OP_OR:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) | REG(r2);
            break;
        }
        case OP_OR_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) | v1;
            break;
        }
        case OP_XOR:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) ^ REG(r2);
            break;
        }
        case OP_XOR_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) ^ v1;
            break;
        }
        case OP_NOT:
        {
            DECODE_REG_REG(ins, rd, r1);
            REG(rd) = ~REG(r1);
            break;
        }
        case OP_SHL:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) << REG(r2);
            break;
        }
        case OP_SHL_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) << v1;
            break;
        }
        case OP_SHR:
        {
            // TODO: ensure this always shifts in 0
            // According to C standard, this is implementation dependent
            // Check the standard myself, seems like C20/23 have actually
            // standardised this stuff
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) >> REG(r2);
            break;
        }
        case OP_SHR_I:
        {
            // TODO: ensure this always shifts in 0
            // According to C standard, this is implementation dependent
            // Check the standard myself, seems like C20/23 have actually
            // standardised this stuff
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) >> v1;
            break;
        }
        case OP_SAR:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            DEF_SIGNED_UNION_WITH_UNSIGNED(tmp, REG(r1));
            tmp.i >>= REG(r2);
            REG(rd) = tmp.u;
            break;
        }
        case OP_SAR_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            DEF_SIGNED_UNION_WITH_UNSIGNED(tmp, REG(r1));
            tmp.i >>= v1;
            REG(rd) = tmp.u;
            break;
        }
        case OP_BSET:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) | (1 << REG(r2));
            break;
        }
        case OP_BCLR:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) & ~(1 << REG(r2));
            break;
        }
        case OP_BTOG:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = REG(r1) ^ (1 << REG(r2));
            break;
        }
        case OP_BTST:
        {
            DECODE_REG_REG_REG(ins, rd, r1, r2);
            REG(rd) = (REG(r1) & (1 << REG(r2))) != 0;
            break;
        }
        case OP_BSET_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) | (1 << v1);
            break;
        }
        case OP_BCLR_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) & ~(1 << v1);
            break;
        }
        case OP_BTOG_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = REG(r1) ^ (1 << v1);
            break;
        }
        case OP_BTST_I:
        {
            DECODE_REG_REG_U10(ins, rd, r1, v1);
            REG(rd) = (REG(r1) & (1 << v1)) != 0;
            break;
        }

        case OP_UJMP_ADDR:
        {
            DECODE_U16(ins, addr);
            f->ip = addr;
            break;
        }
        case OP_UJMP_REG:
        {
            DECODE_REG(ins, reg);
            f->ip = REG(reg);
            break;
        }
        case OP_IN:
        {
            DECODE_U8_REG(ins, port, reg);
            REG(reg) = read(m, port);
            break;
        }
        case OP_OUT_I:
        {
            DECODE_U8_U16(ins, port, value);
            keep_ticking = write(m, port, value);
            break;
        }
        case OP_OUT_REG:
        {
            DECODE_U8_REG(ins, port, reg);
            keep_ticking = write(m, port, REG(reg));
            break;
        }
        case OP_OUT_REG_MASK:
        {
            DECODE_U8_REG_REG(ins, port, r_value, r_mask);
            WORD value = REG(r_value);
            WORD mask = REG(r_mask);
            WORD curr = read(m, port);
            keep_ticking = write(m, port, (curr & ~mask) | (value & mask));
            break;
        }

        case OP_LOAD_I:
        {
            DECODE_REG_U16(ins, r_dst, addr);
            REG(r_dst) = mem_read_uint32_le(&m->mem[addr]);
            break;
        }
        case OP_LOAD_REG:
        {
            DECODE_REG_REG(ins, r_dst, r_addr);
            REG(r_dst) = mem_read_uint32_le(&m->mem[REG(r_addr)]);
            break;
        }
        case OP_STORE_I:
        {
            DECODE_REG_U16(ins, r_val, addr);
            mem_write_uint32_le(&m->mem[addr], REG(r_val));
            break;
        }
        case OP_STORE_REG:
        {
            DECODE_REG_REG(ins, r_dst, r_val);
            mem_write_uint32_le(&m->mem[REG(r_dst)], REG(r_val));
            break;
        }

        case OP_STOREXB:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_addr, r_off, r_val);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            uint32_t offset = REG(r_off);
            m->mem[base + offset] = REG(r_val);
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }
        case OP_STOREXH:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_addr, r_off, r_val);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            uint32_t offset = REG(r_off);
            mem_write_uint16_le(&m->mem[base + offset], (uint16_t)REG(r_val));
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }
        case OP_STOREXW:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_addr, r_off, r_val);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            uint32_t offset = REG(r_off);
            mem_write_uint32_le(&m->mem[base + offset], REG(r_val));
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }
        case OP_STOREXB_I:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_addr, offset, r_val);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            m->mem[base + offset] = REG(r_val);
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }
        case OP_STOREXH_I:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_addr, offset, r_val);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            mem_write_uint16_le(&m->mem[base + offset], (uint16_t)REG(r_val));
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }
        case OP_STOREXW_I:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_addr, offset, r_val);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            mem_write_uint32_le(&m->mem[base + offset], REG(r_val));
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }

        case OP_LOADXB:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_dst, r_addr, r_off);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            uint32_t offset = REG(r_off);
            uint32_t val = m->mem[base + offset];
            if (flags & FLAG_MEMX_SIGN_EXTEND) {
                val = SIGN_EXTEND_8(val);
            }
            REG(r_dst) = val;
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }
        case OP_LOADXH:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_dst, r_addr, r_off);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            uint32_t offset = REG(r_off);
            uint32_t val = mem_read_uint16_le(&m->mem[base + offset]);
            if (flags & FLAG_MEMX_SIGN_EXTEND) {
                val = SIGN_EXTEND_16(val);
            }
            REG(r_dst) = val;
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }
        case OP_LOADXW:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_dst, r_addr, r_off);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            uint32_t offset = REG(r_off);
            uint32_t val = mem_read_uint32_le(&m->mem[base + offset]);
            REG(r_dst) = val;
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }
        case OP_LOADXB_I:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_dst, r_addr, offset);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            uint32_t val = m->mem[base + offset];
            if (flags & FLAG_MEMX_SIGN_EXTEND) {
                val = SIGN_EXTEND_8(val);
            }
            REG(r_dst) = val;
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }
        case OP_LOADXH_I:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_dst, r_addr, offset);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            uint32_t val = mem_read_uint16_le(&m->mem[base + offset]);
            if (flags & FLAG_MEMX_SIGN_EXTEND) {
                val = SIGN_EXTEND_16(val);
            }
            REG(r_dst) = val;
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }
        case OP_LOADXW_I:
        {
            DECODE_F3_U7_U7_U7(ins, flags, r_dst, r_addr, offset);
            uint32_t addr = REG(r_addr);
            uint32_t base = addr & 0xFFFF;
            uint32_t val = mem_read_uint32_le(&m->mem[base + offset]);
            REG(r_dst) = val;
            if (flags & FLAG_MEMX_INC) {
                base = (base + (addr >> 16)) & 0xFFFF;
                REG(r_addr) = (addr & 0xFFFF0000) | base;
            }
            break;
        }

        case OP_STOREFB:
        {
            DECODE_F3_U7_U7(ins, flags, r_addr, r_val);
            m->mem[REG(r_addr)] = REG(r_val);
            break;
        }
        case OP_STOREFH:
        {
            DECODE_F3_U7_U7(ins, flags, r_addr, r_val);
            mem_write_uint16_le(&m->mem[REG(r_addr)], REG(r_val));
            break;
        }
        case OP_STOREFW:
        {
            DECODE_F3_U7_U7(ins, flags, r_addr, r_val);
            mem_write_uint32_le(&m->mem[REG(r_addr)], REG(r_val));
            break;
        }
        case OP_LOADFB:
        {
            DECODE_F3_U7_U7(ins, flags, r_dst, r_addr);
            WORD val = m->mem[REG(r_addr)];
            if (flags & FLAG_MEMX_SIGN_EXTEND) {
                val = SIGN_EXTEND_8(val);
            }
            REG(r_dst) = val;
            break;
        }
        case OP_LOADFH:
        {
            DECODE_F3_U7_U7(ins, flags, r_dst, r_addr);
            WORD val = mem_read_uint16_le(&m->mem[REG(r_addr)]);
            if (flags & FLAG_MEMX_SIGN_EXTEND) {
                val = SIGN_EXTEND_16(val);
            }
            REG(r_dst) = val;
            break;
        }
        case OP_LOADFW:
        {
            DECODE_F3_U7_U7(ins, flags, r_dst, r_addr);
            WORD val = mem_read_uint32_le(&m->mem[REG(r_addr)]);
            REG(r_dst) = val;
            break;
        }

        case OP_PUSH_I:
        {
            DECODE_S17(ins, val);
            PUSH(val);
            break;
        }
        case OP_PUSH_REG:
        {
            DECODE_REG(ins, r_val);
            PUSH(REG(r_val));
            break;
        }
        case OP_POP:
        {
            POP();
            break;
        }
        case OP_POP_REG:
        {
            DECODE_REG(ins, r_dst);
            REG(r_dst) = POP();
            break;
        }
        case OP_RSV:
        {
            DECODE_REG(ins, n);
            m->sp = f->bp + n;
            break;
        }

        case OP_BCALL:
        {
            DECODE_REG_U5_U12(ins, r_res, nargs, fn);
            if (fn < BIF_MAX) {
                REG(r_res) = bif_table[fn](&m->stack[m->sp - nargs], nargs);
            } else {
                // TODO: probably trap this with an event, maybe even halt the machine
                REG(r_res) = 0xDEADBEEF;
            }
            POPN(nargs);
            break;
        }
        case OP_BCALL_DISCARD:
        {
            DECODE_REG_U5_U12(ins, r_res, nargs, fn);
            if (fn < BIF_MAX) {
                bif_table[fn](&m->stack[m->sp - nargs], nargs);
            } else {
                // TODO: probably trap this with an event, maybe even halt the machine
            }
            POPN(nargs);
            break;
        }
        case OP_CALL_REG:
        {
            DECODE_REG_REG_REG(ins, r_dst, r_fn, nargs);
            f->r_dst = r_dst;
            m->fp++;
            m->frames[m->fp].ip = REG(r_fn);
            m->frames[m->fp].bp = m->sp - nargs;
            m->frames[m->fp].nargs = nargs;
            break;
        }
        case OP_NARGS:
        {
            DECODE_REG(ins, r_dst);
            REG(r_dst) = f->nargs;
            break;
        }
        case OP_RET_I:
        {
            DECODE_S17(ins, val);
            m->sp = f->bp;
            f = &(m->frames[--m->fp]);
            REG(f->r_dst) = val;
            break;
        }
        case OP_RET_REG:
        {
            DECODE_REG(ins, r_ret);
            WORD ret = REG(r_ret);
            m->sp = f->bp;
            f = &(m->frames[--m->fp]);
            REG(f->r_dst) = ret;
            break;
        }

        case OP_DUMP:
        {
            printf("=== beam256 dump ===\n");
            printf("fp=%d sp=%d\n", m->fp, m->sp);
            printf("frame: bp=%d ip=%d\n", f->bp, f->ip);

            printf("frame locals:\n");
            for (int i = f->bp; i < m->sp; i++) {
                const int reg = i - f->bp;
                printf("  r%d = %d\n", reg, REG(reg));
            }

            break;
        }

        case OP_HALT:
            m->halted = 1;
            break;

        default:
            // TODO: we should probably fire an event here
            printf("UNKNOWN INSTRUCTION: %d\n", OP(ins));
            break;
    }

    return keep_ticking;
}

// we'll use port 0xFF as a "debug" IO port
// we just store the last value written, and allow it to be read back
static WORD debug_io = 0;

static WORD read(machine_t *m, uint8_t port) {
    if (port == 0xFF) {
        return debug_io;
    }
    return 0;
}

// write() writes a value to the given IO port.
// Writing to an IO port may trigger a synchronous callback to the host
// application.
// A return value of zero indicates that the current tick should be aborted
// and control should return to the host application.
static int write(machine_t *m, uint8_t port, WORD value) {
    if (port == 0xFF) {
        debug_io = value;
        m->on_event(EV_IO_WRITE, port, value);
    }

    return 1;
}

