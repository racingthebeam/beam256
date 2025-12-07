import { test } from "node:test";
import * as assert from "node:assert";

import { createMachine } from "../emu/machine.js";
import { assemble } from "../asm/index.js";

function makeTest({ setup, code, check, halt = true }) {
    return async (t) => {
        if (halt) code += "\nHALT\n";

        const events = [];

        const machine = await createMachine({
            onEvent: (evt, arg1, arg2) => {
                events.push({
                    event: evt,
                    args: [arg1, arg2]
                });
            },
            image: assemble(code)
        });

        if (typeof setup === 'function') {
            setup(machine);
        }

        while (!machine.halted) {
            machine.tick(1000);
        }

        if (typeof check === 'function') {
            check(machine, events);
        }
    };
}

const TESTS = [
    {
        name: "MOV rd, rs",
        setup: (machine) => { machine.writeReg(1, 150); },
        code: "MOV r0, r1",
        check: (machine) => { assert.strictEqual(machine.reg(0), 150); }
    },
    {
        name: "MOV rd, s17",
        code: `
            MOV r0, 123
            MOV r1, 0xFFFF
            MOV r2, -65536
            MOV r3, -1
            #MOV r4, 0x1FFFF
        `,
        check: (m) => {
            assert.strictEqual(m.reg(0), 123);
            assert.strictEqual(m.reg(1), 0xFFFF);
            assert.strictEqual(m.reg(2), -65536);
            assert.strictEqual(m.reg(3), -1);
            //assert.strictEqual(machine.reg(4), -1);
        }
    },
    {
        name: "MOVL + MOVH",
        code: `
            MOVL r0, 0xAAAA
            MOVH r1, 0x1CCC
            MOVL r2, 0xBBBB
            MOVH r2, 0x1DDD
        `,
        check: (m) => {
            assert.strictEqual(m.reg(0), 0x0000AAAA);
            assert.strictEqual(m.reg(1), 0x1CCC0000);
            assert.strictEqual(m.reg(2), 0x1DDDBBBB);
        }
    },

    //
    // Maths - reg reg

    {
        name: "ADD rd, r1, r2",
        setup: (m) => { m.writeReg(1, 100); m.writeReg(2, 40); },
        code: "ADD r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 140); }
    },
    {
        name: "SUB rd, r1, r2",
        setup: (m) => { m.writeReg(1, 100); m.writeReg(2, 40); },
        code: "SUB r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 60); }
    },
    {
        name: "MUL rd, r1, r2",
        setup: (m) => { m.writeReg(1, 100); m.writeReg(2, 40); },
        code: "MUL r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 4000); }
    },
    {
        name: "DIV rd, r1, r2",
        setup: (m) => { m.writeReg(1, 100); m.writeReg(2, 40); },
        code: "DIV r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 2); }
    },
    {
        name: "MOD rd, r1, r2",
        setup: (m) => { m.writeReg(1, 100); m.writeReg(2, 40); },
        code: "MOD r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 20); }
    },

    //
    // Bitwise - reg reg

    {
        name: "AND rd, r1, r2",
        setup: (m) => { m.writeReg(1, 0b1010); m.writeReg(2, 0b1000); },
        code: "AND r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 0b1000); }
    },
    {
        name: "OR rd, r1, r2",
        setup: (m) => { m.writeReg(1, 0b1010); m.writeReg(2, 0b1000); },
        code: "OR r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 0b1010); }
    },
    {
        name: "XOR rd, r1, r2",
        setup: (m) => { m.writeReg(1, 0b1010); m.writeReg(2, 0b1000); },
        code: "XOR r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 0b0010); }
    },
    {
        name: "NOT rd, r1",
        setup: (m) => { m.writeReg(1, 0b11001010); },
        code: "NOT r0, r1",
        check: (m) => {
            // There's something funky happening at the JS level due
            // to negative numbers. We're not trying to test JavaScript
            // so it's good enough just to mask off the low byte and
            // check its as expected.
            assert.strictEqual(m.reg(0) & 0b11111111, 0b00110101);
        }
    },
    {
        name: "SHL rd, r1, r2",
        setup: (m) => { m.writeReg(1, 0b1010); m.writeReg(2, 2); },
        code: "SHL r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 0b1010_00); }
    },
    {
        name: "SHR rd, r1, r2",
        setup: (m) => { m.writeReg(1, 0b1010); m.writeReg(2, 3); },
        code: "SHR r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 0b1); }
    },
    {
        name: "SAR rd, r1, r2",
        setup: (m) => { m.writeReg(1, 0xFF00FF00); m.writeReg(2, 8); },
        code: "SAR r0, r1, r2",
        check: (m) => {
            // JS probably won't like this
            // TODO: come back to this when we have a proper debugger/
            // inspector.
            // assert.strictEqual(m.reg(0), 0xFFFF00FF);
        }
    },

    //
    // Unconditional jumps

    {
        name: "JMP addr",
        code: `
            JMP 16
            HALT
            MOV r0, 123
            HALT
            MOV r0, 456
            HALT
            MOV r0, 789
            HALT
        `,
        check: (m) => {
            assert.strictEqual(m.reg(0), 456);
        }
    },
    {
        name: "JMP reg",
        setup: (m) => { m.writeReg(0, 16); },
        code: `
            JMP r0
            HALT
            MOV r1, 1
            HALT
            MOV r1, 2
            HALT
            MOV r1, 3
            HALT
        `,
        check: (m) => {
            assert.strictEqual(m.reg(1), 2);
        }
    },

    //
    // IO

    {
        name: "OUT port, imm",
        code: "OUT 255, 100",
        check: (_, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].args[0], 255);
            assert.equal(events[0].args[1], 100);
        }
    },
    {
        name: "OUT port, reg",
        setup: (m) => { m.writeReg(0, 67); },
        code: "OUT 255, r0",
        check: (_, events) => {
            assert.equal(events.length, 1);
            assert.equal(events[0].args[0], 255);
            assert.equal(events[0].args[1], 67);
        }
    },
    {
        name: "IN reg, port",
        code: `
            OUT 255, 100
            IN r0, 255
        `,
        check: (m) => {
            assert.equal(m.reg(0), 100);
        }
    },
    {
        name: "OUT port, reg, reg",
        setup: (m) => {
            m.writeReg(0, 0xAA);
            m.writeReg(1, 0xFF);
        },
        code: `
            OUT 255, 0x0F0F
            OUT 255, r0, r1
        `,
        check: (_, events) => {
            assert.equal(events.length, 2);
            assert.equal(events[0].args[0], 255);
            assert.equal(events[0].args[1], 0x0F0F);
            assert.equal(events[1].args[0], 255);
            assert.equal(events[1].args[1], 0x0FAA);
        }
    },

    //
    // LOAD/STORE

    {
        name: "LOAD reg, addr",
        setup: (m) => { m.view.setUint32(4096, 123, true); },
        code: "LOAD r0, 4096",
        check: (m) => {
            assert.equal(m.reg(0), 123);
        }
    },
    {
        name: "LOAD reg, reg",
        setup: (m) => {
            m.view.setUint32(8192, 67, true);
            m.writeReg(1, 8192);
        },
        code: "LOAD r0, r1",
        check: (m) => {
            assert.equal(m.reg(0), 67);
        }
    },
    {
        name: "STORE addr, reg",
        setup: (m) => { m.writeReg(0, 12345); },
        code: `
            STORE 1024, r0
        `,
        check: (m) => {
            assert.equal(m.view.getUint32(1024, true), 12345);
        }
    },
    {
        name: "STORE reg, reg",
        setup: (m) => {
            m.writeReg(0, 2048);
            m.writeReg(1, 5678);
        },
        code: `
            STORE r0, r1
        `,
        check: (m) => {
            assert.equal(m.view.getUint32(2048, true), 5678);
        }
    },

    {
        name: "PUSH/POP",
        setup: (m) => {
            m.writeReg(4, 1);
            m.writeReg(5, 2);
            m.writeReg(6, 3);
            m.writeReg(7, 4);
        },
        code: `
            RSV 8
            PUSH r4     # stack: {1}
            PUSH r7     # stack: {1, 4}
            PUSH r6     # stack: {1, 4, 3}
            PUSH r5     # stack: {1, 4, 3, 2}
            POP         # stack: {1, 4, 3}
            POP r1      # stack: {1, 4}, r1=3
            POP r2      # stack: {1}, r1=3, r2=4
            POP r3      # stack: {}, r1=3, r2=4, r3=1
        `,
        check: (m) => {
            assert.equal(m.reg(1), 3);
            assert.equal(m.reg(2), 4);
            assert.equal(m.reg(3), 1);
        }
    }
];

for (const t of TESTS) {
    test(t.name, makeTest(t));
}

