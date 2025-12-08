// Encoders defines binary encoders for each distinct instruction
// coding. First argument to all encoders is the opcode, followed

import { isNumeric } from "./ast.js";

// by the instruction's arguments, represented as AST nodes.
export const Encoders = {
    op: (op) => {
        return encodeOp(op);
    },
    u16: (op, v1) => {
        assertIntegerConstant("v1", v1);
        // TODO: should we check the range here?
        // TODO: should we allow negative values and just encode using 2s comp?
        return encodeOp(op) | (v1.val & 0xFFFF);
    },
    reg: (op, r1) => {
        assertType("r1", r1, "reg");
        return encodeOp(op) | encodeReg(r1.reg, 16);
    },

    // u7 encoding is only used by RSV
    u7: (op, v1) => {
        assertIntegerConstant("v1", v1);
        return encodeOp(op) | encodeReg(v1.val, 16);
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
    s17: (op, v1) => {
        assertIntegerConstant("v1", v1);
        return encodeOp(op) | encodeS17(v1.val);
    },
    reg_u16: (op, r1, v1) => {
        assertType("r1", r1, "reg");
        assertIntegerConstant("v1", v1);
        return encodeOp(op) | encodeReg(r1.reg, 16) | encodeU16(v1.val);
    },

    u8_u16: (op, v1, v2) => {
        assertIntegerConstant("v1", v1); // TODO: need a range check for sure
        assertIntegerConstant("v2", v2); // TODO: need a range check for sure
        return encodeOp(op) | encodeU8(v1.val, 16) | encodeU16(v2.val);
    },
    u8_reg: (op, v1, r1) => {
        assertIntegerConstant("v1", v1); // TODO: need a range check for sure
        assertType("r1", r1, "reg");
        return encodeOp(op) | encodeU8(v1.val, 16) | encodeReg(r1.reg, 8);
    },
    u8_reg_reg: (op, v1, r1, r2) => {
        assertIntegerConstant("v1", v1); // TODO: need a range check for sure
        assertType("r1", r1, "reg");
        assertType("r2", r2, "reg");
        return encodeOp(op) | encodeU8(v1.val, 16) | encodeReg(r1.reg, 8) | encodeReg(r2.reg, 0);
    },
    reg_u5_u12: (op, r1, v1, v2) => {
        assertType("r1", r1, "reg");
        assertIntegerConstant("v1", v1);
        assertIntegerConstant("v2", v2);
        return encodeOp(op) | encodeReg(r1.reg, 17) | encodeReg(v1.val, 12) | encodeReg(v2.val, 0);
    },
    u5_u12: (op, v1, v2) => {
        assertIntegerConstant("v1", v1);
        assertIntegerConstant("v2", v2);
        return encodeOp(op) | encodeReg(v1.val, 12) | encodeReg(v2.val, 0);
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

function encodeU8(val, lshift) {
    return (val & 0xFF) << lshift;
}

function encodeReg(reg, lshift) {
    return (reg & 0x7F) << lshift;
}

// value is an integer in the range -65536..65535 (inclusive)
// we need to turn this into a bit pattern.
export function encodeS17(value) {
    return value & 0x1FFFF;
}

export function encodeU5(value) {
    return value & 0x1F;
}

export function encodeU12(value) {
    return value & 0xFFF;
}

export function encodeU16(value) {
    return value & 0xFFFF;
}

function encodeAddr(addr, lshift) {
    return (addr & 0xFFFF) << lshift;
}
