export function opcode(op) {
    return op >> 24;
}

export const OpNop = 0x00;

// Load/store
export const OpSet = 0x01;
export const OpISet = 0x02;
export const OpISetH = 0x03;
export const OpISetL = 0x04;
export const OpILoad = 0x05;
export const OpIStore = 0x06;
export const OpLoad = 0x07;
export const OpStore = 0x08;

// Maths
export const OpAdd = 0x11;
export const OpSub = 0x12;
export const OpMul = 0x13;
export const OpDiv = 0x14;
export const OpPow = 0x15;

// Bitwise
export const OpOr = 0x20;
export const OpAnd = 0x21;
export const OpXor = 0x22;
export const OpNot = 0x23;
export const OpLShift = 0x24;
export const OpRShift = 0x25;

// RNG
export const OpRand = 0x30;
export const OpIRand = 0x31;
export const OpRRand = 0x32;

// Function calling
export const OpCall = 0x40;
export const OpICall = 0x41;
export const OpReserve = 0x42;
export const OpRet = 0x43;
export const OpIRet = 0x44;
export const OpRRet = 0x45;

export const OpRPush = 0x46;
export const OpIPush = 0x47;
export const OpRPop = 0x48;
export const OpPop = 0x49;

// Comparison/flow control
export const OpCmp = 0x50;
export const OpJmp = 0x51;
export const OpJZ = 0x52;
export const OpJNZ = 0x53;
export const OpJC = 0x54;
export const OpJNC = 0x55;
export const OpJEQ = 0x56;
export const OpIJEQ = 0x57;
export const OpJNQ = 0x58;
export const OpIJNQ = 0x59;

// Special
export const OpHalt = 0x70;
export const OpDumpState = 0x71;
export const OpDumpRegs = 0x72;

//
// Helper functions to generate ops as 32-bit integers

export function NOP() { return mk(OpNop); }

export function SET(rd, rs) { return mk_reg2(OpSet, rd, rs); }

// we'll reserve ISET for doing ARM/thumb-like "clever" stuff...
export function ISET(rd, val) { throw new Error("not implemented"); }
export function ISETH(rd, val) { return mk_reg_u16(OpISetH, rd, val); }
export function ISETL(rd, val) { return mk_reg_u16(OpISetL, rd, val); }
export function ILOAD(rd, addr) { return mk_reg_u16(OpILoad, rd, addr); }
export function ISTORE(rs, addr) { return mk_reg_u16(addr, rs, OpIStore); }

// TODO(rtb): I think we need immediate versions of some math/bitwise opcodes
// There's no point wasting registers to store small constants/bitmasks.

export function ADD(rd, r1, r2) { return mk_reg3(OpAdd, rd, r1, r2); }
export function SUB(rd, r1, r2) { return mk_reg3(OpSub, rd, r1, r2); }
export function MUL(rd, r1, r2) { return mk_reg3(OpMul, rd, r1, r2); }
export function DIV(rd, r1, r2) { return mk_reg3(OpDiv, rd, r1, r2); }
export function POW(rd, r1, r2) { return mk_reg3(OpPow, rd, r1, r2); }

export function OR(rd, r1, r2) { return mk_reg3(OpOr, rd, r1, r2); }
export function AND(rd, r1, r2) { return mk_reg3(OpAnd, rd, r1, r2); }
export function XOR(rd, r1, r2) { return mk_reg3(OpXor, rd, r1, r2); }
export function LSH(rd, r1, r2) { return mk_reg3(OpLShift, rd, r1, r2); }
export function RSH(rd, r1, r2) { return mk_reg3(OpRShift, rd, r1, r2); }
export function NOT(rd, r) { return mk_reg2(OpNot, rd, r); }

// RAND(rd)
// Sets rd to a random 32 bit value
export function RAND(rd) { return mk_reg(OpRand, rd); }

// IRAND(rd, min, max)
// Sets rd to a value between immediate values min and max (inclusive)
export function IRAND(rd, min, max) { return mk_reg3(OpIRand, rd, min, max); }

// RRAND(rd, rmin, rmax)
// Sets rd to a value between the contents of rmin and rmax (inclusive)
export function RRAND(rd, rmin, rmax) { return mk_reg3(OpRRand, rd, rmin, rmax); }

// ICALL(nArgs, addr) calls the function addr with the given number of arguments.
// The arguments are expected to be arranged in reverse order at the top of the
// current function frame. That is, the first arg occupies the last slot.
export function ICALL(nArgs, addr) { return mk_reg_u16(OpICall, nArgs, addr); }

// CALL(nArgs, reg) calls the function pointed to by the given register,
// with the given number of arguments. See the documentation for ICALL(), above,
// for an explanation of the calling convention.
export function CALL(nArgs, addr) { return mk_reg_u16(OpCall, nArgs, addr); }

// RSV(nLocals) reserves space for nLocals in the current call frame
export function RSV(nLocals) { return mk_reg(OpReserve, nLocals); }

// TODO(rtb): review this return stuff, doesn't feel right...

// IPUSH() pushes an immediate value onto the stack
export function IPUSH(val) { return mk_u16(OpIPush, val); }

// RPUSH() pushes a register onto the stack
export function RPUSH(reg) { return mk_reg(OpRPush, reg); }

// RPOP() pops a value into the specified register
export function RPOP(reg) { return mk_reg(OpRPop, reg); }

// POP() pops a value from stack, discarding it
export function POP() { return mk(OpPop); }

// RET() returns from the previous CALL(), returning 0
export function RET() { return mk(OpRet); }

// IRET(val) returns from the previous CALL() with an immediate 16-bit value
export function IRET(val) { return mk_u16(OpIRet, val); }

// RRET(val) returns from the previous CALL() with the value from the given register
export function RRET(r) { return mk_reg(OpRRet, r); }

// CMP(r1, r2) compares the contents of registers r1 and r2 and stores the results
// in the flags registers.
export function CMP(r1, r2) { return mk_reg2(r1, r2); }

// JMP(addr) jumps unconditionally to given address
export function JMP(addr) { return mk_u16(OpJmp, addr); }

// JZ(addr) jumps to address if the zero flag is set
export function JZ(addr) { return mk_u16(OpJZ, addr); }

// JNZ(addr) jumps to address if the zero flag is not set
export function JNZ(addr) { return mk_u16(OpJNZ, addr); }

// JC(addr) jumps to address if the carry flag is set
export function JC(addr) { return mk_u16(OpJC, addr); }

// JNC(addr) jumps to address if the carry flag is not set
export function JNC(addr) { return mk_u16(OpJC, addr); }

// JEQ(rel, r1, r2) performs a relative jump if r1 == r2
// rel is specified as a signed number of instructions (e.g. the actual jump
// will be multiplied by 4)
export function JEQ(rel, r1, r2) { return mk_reg3(OpJEQ, rel, r1, r2); }

// JNQ(rel, r1, r2) performs a relative jump if r1 != r2
// rel is specified as a signed number of instructions (e.g. the actual jump
// will be multiplied by 4)
export function JNQ(rel, r1, r2) { return mk_reg3(OpJNQ, rel, r1, r2); }

// TODO(rtb): i think these immediate variants are overkill... review...

// IJEQ(rel, r, val) performs a relative jump if r == val (unsigned 8 bit immediate)
// rel is specified as a signed number of instructions (e.g. the actual jump
// will be multiplied by 4)
export function IJEQ(rel, r, val) { return mk_reg3(OpIJEQ, rel, r, val); }

// IJNQ(rel, r, val) performs a relative jump if r != val (unsigned 8 bit immediate)
// rel is specified as a signed number of instructions (e.g. the actual jump
// will be multiplied by 4)
export function IJNQ(rel, r, val) { return mk_reg3(OpIJNQ, rel, r, val); }

export function HALT() { return mk(OpHalt); }

// DMP() dumps the machine state without interrupting program execution
// The dump mechanism is implementation specific
export function DMP() { return mk(OpDumpState); }

// RDMP() dumps the contents of registers between rmin and rmax (inclusive)
// The dump mechanism is implementation specific
export function RDMP(rmin, rmax) { return mk_reg2(OpDumpRegs, rmin, rmax); }

function mk(opcode) {
    return opcode << 24;
}

function mk_u16(opcode, val) {
    val &= 0xFFFF;
    return (opcode << 24) | (val << 8);
}

function mk_reg_u16(opcode, r, addr) {
    r &= 0xFF;
    addr &= 0xFFFF;
    return (opcode << 24) | (r << 16) | addr;
}

function mk_reg(opcode, r) {
    r &= 0xFF;
    return (opcode << 24) | (r << 16);
}

function mk_reg2(opcode, r1, r2) {
    r1 &= 0xFF;
    r2 &= 0xFF;
    return (opcode << 24) | (r1 << 16) | (r2 << 8);
}

function mk_reg3(opcode, r1, r2, r3) {
    r1 &= 0xFF;
    r2 &= 0xFF;
    r3 &= 0xFF;
    return (opcode << 24) | (r1 << 16) | (r2 << 8) | r3;
}

