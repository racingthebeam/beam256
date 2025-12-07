#include <stdint.h>
#include <stdio.h>

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

void mem_write_uint32_le(uint8_t *dst, uint32_t val) {
    dst[0] = (val >> 0) & 0xFF;
    dst[1] = (val >> 8) & 0xFF;
    dst[2] = (val >> 16) & 0xFF;
    dst[3] = (val >> 24) & 0xFF;
}

void mem_write_uint16_le(uint8_t *dst, uint16_t val) {
    dst[0] = (val >> 0) & 0xFF;
    dst[1] = (val >> 8) & 0xFF;
}

