// Encoders defines binary encoders for each distinct instruction
// coding. First argument to all encoders is the opcode, followed
// by the instruction's arguments, represented as AST nodes.
export const Encoders = {
    op: (op) => {
        return encodeOp(op);
    },
    reg_reg: (op, r1, r2) => {
        assertType("r1", r1, "reg");
        assertType("r2", r1, "reg");
        return encodeOp(op) | encodeReg(r1.reg, 16) | encodeReg(r2.reg, 8);
    },
    // reg_s17: (op, r, val) => {
    //     // TODO: need test runner
    // },
    // reg_b16: (op, r, val) => {
    //     // TODO: need test runner
    // },
    // addr_reg: (op, addr, r) => {
    //     return encodeOp(op) | encodeAddr(addr, 8) | encodeReg(r, 0);
    // }
};

function assertType(label, v, t) {
    if (v.type !== t) throw new Error(`expected ${label} to have type ${t}, got ${v.type}`);
}

function encodeOp(op) {
    return (op & 0xFF) << 24;
}

function encodeReg(reg, lshift) {
    return (reg & 0x7F) << lshift;
}

function encodeAddr(addr, lshift) {
    return (addr & 0xFFFF) << lshift;
}
