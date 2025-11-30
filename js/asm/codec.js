// Encoders defines binary encoders for each distinct instruction
// coding. First argument to all encoders is the opcode, followed

import { isNumeric } from "./ast.js";

// by the instruction's arguments, represented as AST nodes.
export const Encoders = {
    op: (op) => {
        return encodeOp(op);
    },
    reg_reg: (op, r1, r2) => {
        assertType("r1", r1, "reg");
        assertType("r2", r2, "reg");
        return encodeOp(op) | encodeReg(r1.reg, 16) | encodeReg(r2.reg, 8);
    },
    reg_reg_reg: (op, r1, r2, r3) => {
        assertType("r1", r1, "reg");
        assertType("r2", r2, "reg");
        assertType("r3", r3, "reg");
        return encodeOp(op) | encodeReg(r1.reg, 16) | encodeReg(r2.reg, 8) | encodeReg(r3.reg, 0);
    },
    reg_s17: (op, r1, v1) => {
        assertType("r1", r1, "reg");
        assertIntegerConstant("v1", v1);
        return encodeOp(op) | encodeReg(r1.reg, 17) | encodeS17(v1.val);
    },
    reg_u16: (op, r1, v1) => {
        assertType("r1", r1, "reg");
        assertIntegerConstant("v1", v1);
        return encodeOp(op) | encodeReg(r1.reg, 16) | encodeU16(v1.val);
    },
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

function assertIntegerConstant(label, v) {
    if (!isNumeric(v)) {
        throw new Error(`expected ${label} to be integer constant`);
    }
}

function encodeOp(op) {
    return (op & 0xFF) << 24;
}

function encodeReg(reg, lshift) {
    return (reg & 0x7F) << lshift;
}

// value is an integer in the range -65536..65535 (inclusive)
// we need to turn this into a bit pattern.
export function encodeS17(value) {
    return value & 0x1FFFF;
}

export function encodeU16(value) {
    return value & 0xFFFF;
}

function encodeAddr(addr, lshift) {
    return (addr & 0xFFFF) << lshift;
}
