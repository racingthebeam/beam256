export const Encoders = {
    op: (op) => {
        return encodeOp(op);
    },
    reg_reg: (op, r1, r2) => {
        return encodeOp(op) | encodeReg(r1, 16) | encodeReg(r2, 8);
    },
    reg_s17: (op, r, val) => {
        // TODO: need test runner
    },
    reg_b16: (op, r, val) => {
        // TODO: need test runner
    },
    addr_reg: (op, addr, r) => {
        return encodeOp(op) | encodeAddr(addr, 8) | encodeReg(r, 0);
    }
};

function encodeOp(op) {
    return (op & 0xFF) << 24;
}

function encodeReg(reg, lshift) {
    return (reg & 0x7F) << lshift;
}

function encodeAddr(addr, lshift) {
    return (addr & 0xFFFF) << lshift;
}
