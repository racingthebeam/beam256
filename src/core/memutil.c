#include <stdint.h>

uint32_t mem_read_uint32_le(uint8_t *mem) {
    return ((uint32_t)mem[0]) |
        ((uint32_t)mem[1] << 8) |
        ((uint32_t)mem[2] << 16) |
        ((uint32_t)mem[3] << 24);
}

uint16_t mem_read_uint16_le(uint8_t *mem) {
    return ((uint16_t)mem[0]) |
        ((uint16_t)mem[1] << 8);
}

