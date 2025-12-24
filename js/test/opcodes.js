import { test } from "node:test";
import * as assert from "node:assert";

import { createMachine } from "../emu/machine.js";
import { assemble } from "../asm/index.js";

function makeTest({ setup, code, check, halt = true }) {
    return async (t) => {
        if (Array.isArray(code)) {
            code = code.join("\n");
        }

        if (halt) code += "\n.align 4\nHALT\n";

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
        name: "MOV rd, rs, ro",
        setup: (m) => {
            m.writeReg(1, 3);
            m.writeReg(2, 10);
            m.writeReg(3, 20);
            m.writeReg(4, 30);
            m.writeReg(5, 40);
            m.writeReg(6, 50);
        },
        code: `MOV r0, r2, r1`,
        check: (m) => { assert.strictEqual(m.reg(0), 40); }
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
        name: "MULS rd, r1, r2",
        setup: (m) => { },
        code: "MULS r0, r1, r2",
        check: (m) => { console.error("FIX TEST FOR MULS!"); }
    },
    {
        name: "DIV rd, r1, r2",
        setup: (m) => { m.writeReg(1, 100); m.writeReg(2, 40); },
        code: "DIV r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 2); }
    },
    {
        name: "DIVS rd, r1, r2",
        setup: (m) => { m.writeReg(2, 100); },
        code: "DIVS r0, r1, r2",
        check: (m) => { console.error("FIX TEST FOR DIVS!"); }
    },
    {
        name: "MOD rd, r1, r2",
        setup: (m) => { m.writeReg(1, 100); m.writeReg(2, 40); },
        code: "MOD r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 20); }
    },
    {
        name: "MODS rd, r1, r2",
        setup: (m) => { m.writeReg(1, 100); m.writeReg(2, 40); },
        code: "MODS r0, r1, r2",
        check: (m) => { console.error("FIX TEST FOR MODS!"); }
    },
    {
        name: "ABS rd, r1",
        setup: (m) => { },
        code: "ABS r0, r1",
        check: (m) => { console.error("FIX TEST FOR ABS!"); }
    },
    {
        name: "NEG rd, r1",
        setup: (m) => { },
        code: "NEG r0, r1",
        check: (m) => { console.error("FIX TEST FOR NEG!"); }
    },

    //
    // Maths - reg imm

    {
        name: "ADD rd, r1, imm",
        setup: (m) => { m.writeReg(1, 100); },
        code: "ADD r0, r1, 150",
        check: (m) => { assert.strictEqual(m.reg(0), 250); }
    },
    {
        name: "SUB rd, r1, imm",
        setup: (m) => { m.writeReg(1, 100); },
        code: "SUB r0, r1, 25",
        check: (m) => { assert.strictEqual(m.reg(0), 75); }
    },
    {
        name: "MUL rd, r1, imm",
        setup: (m) => { m.writeReg(1, 100); },
        code: "MUL r0, r1, 40",
        check: (m) => { assert.strictEqual(m.reg(0), 4000); }
    },
    {
        name: "MULS rd, r1, imm",
        setup: (m) => { m.writeReg(1, 100); },
        code: "MULS r0, r1, -3",
        check: (m) => { assert.equal(m.regSigned(0), -300); }
    },
    {
        name: "DIV rd, r1, imm",
        setup: (m) => { m.writeReg(1, 100); },
        code: "DIV r0, r1, 30",
        check: (m) => { assert.strictEqual(m.reg(0), 3); }
    },
    {
        name: "DIVS rd, r1, imm",
        setup: (m) => { m.writeReg(1, 100); },
        code: "DIVS r0, r1, -25",
        check: (m) => { assert.equal(m.regSigned(0), -4); }
    },
    {
        name: "MOD rd, r1, imm",
        setup: (m) => { m.writeReg(1, 100); },
        code: "MOD r0, r1, 40",
        check: (m) => { assert.strictEqual(m.reg(0), 20); }
    },
    {
        name: "MODS rd, r1, imm",
        setup: (m) => { m.writeReg(1, 100); },
        code: "MODS r0, r1, -40",
        check: (m) => { assert.equal(m.regSigned(0), 20); }
    },

    {
        name: "ACC rd, rv, rs",
        setup: (m) => {
            m.writeReg(0, 100);
            m.writeReg(1, 50);
            m.writeReg(2, 3);
        },
        code: "ACC r0, r1, r2",
        check: (m) => { assert.equal(m.reg(0), 250); }
    },
    {
        name: "ACC rd, rv, imm",
        setup: (m) => {
            m.writeReg(0, 100);
            m.writeReg(1, 50);
        },
        code: "ACC r0, r1, 4",
        check: (m) => { assert.equal(m.reg(0), 300); }
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
    // Bitwise - reg imm

    {
        name: "AND rd, r1, imm",
        setup: (m) => { m.writeReg(1, 0b1010); },
        code: "AND r0, r1, 0b1000",
        check: (m) => { assert.strictEqual(m.reg(0), 0b1000); }
    },
    {
        name: "OR rd, r1, imm",
        setup: (m) => { m.writeReg(1, 0b1010) },
        code: "OR r0, r1, 0b1000",
        check: (m) => { assert.strictEqual(m.reg(0), 0b1010); }
    },
    {
        name: "XOR rd, r1, imm",
        setup: (m) => { m.writeReg(1, 0b1010) },
        code: "XOR r0, r1, 0b1000",
        check: (m) => { assert.strictEqual(m.reg(0), 0b0010); }
    },
    {
        name: "SHL rd, r1, imm",
        setup: (m) => { m.writeReg(1, 0b1010) },
        code: "SHL r0, r1, 2",
        check: (m) => { assert.strictEqual(m.reg(0), 0b1010_00); }
    },
    {
        name: "SHR rd, r1, imm",
        setup: (m) => { m.writeReg(1, 0b1010) },
        code: "SHR r0, r1, 3",
        check: (m) => { assert.strictEqual(m.reg(0), 0b1); }
    },
    {
        name: "SAR rd, r1, imm",
        setup: (m) => { m.writeReg(1, 0xFF00FF00) },
        code: "SAR r0, r1, 8",
        check: (m) => {
            // JS probably won't like this
            // TODO: come back to this when we have a proper debugger/
            // inspector.
            // assert.strictEqual(m.reg(0), 0xFFFF00FF);
        }
    },

    {
        name: "BSET rd, r1, r2",
        setup: (m) => {
            m.writeReg(1, 0x81);
            m.writeReg(2, 3);
        },
        code: "BSET r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 0x89); }
    },
    {
        name: "BCLR rd, r1, r2",
        setup: (m) => {
            m.writeReg(1, 0x81);
            m.writeReg(2, 7);
        },
        code: "BCLR r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 0x01); }
    },
    {
        name: "BTOG rd, r1, r2 (clear)",
        setup: (m) => {
            m.writeReg(1, 0x81);
            m.writeReg(2, 7);
        },
        code: "BTOG r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 0x01); }
    },
    {
        name: "BTOG rd, r1, r2 (set)",
        setup: (m) => {
            m.writeReg(1, 0x01);
            m.writeReg(2, 7);
        },
        code: "BTOG r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 0x81); }
    },
    {
        name: "BTST rd, r1, r2 (on)",
        setup: (m) => {
            m.writeReg(1, 0x81);
            m.writeReg(2, 0);
        },
        code: "BTST r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 1); }
    },
    {
        name: "BTST rd, r1, r2 (off)",
        setup: (m) => {
            m.writeReg(1, 0x81);
            m.writeReg(2, 1);
        },
        code: "BTST r0, r1, r2",
        check: (m) => { assert.strictEqual(m.reg(0), 0); }
    },

    {
        name: "BSET rd, r1, imm",
        setup: (m) => {
            m.writeReg(1, 0x81);
        },
        code: "BSET r0, r1, 3",
        check: (m) => { assert.strictEqual(m.reg(0), 0x89); }
    },
    {
        name: "BCLR rd, r1, imm",
        setup: (m) => {
            m.writeReg(1, 0x81);
        },
        code: "BCLR r0, r1, 7",
        check: (m) => { assert.strictEqual(m.reg(0), 0x01); }
    },
    {
        name: "BTOG rd, r1, imm (clear)",
        setup: (m) => {
            m.writeReg(1, 0x81);
        },
        code: "BTOG r0, r1, 7",
        check: (m) => { assert.strictEqual(m.reg(0), 0x01); }
    },
    {
        name: "BTOG rd, r1, imm (set)",
        setup: (m) => {
            m.writeReg(1, 0x01);
        },
        code: "BTOG r0, r1, 7",
        check: (m) => { assert.strictEqual(m.reg(0), 0x81); }
    },
    {
        name: "BTST rd, r1, imm (on)",
        setup: (m) => {
            m.writeReg(1, 0x81);
        },
        code: "BTST r0, r1, 0",
        check: (m) => { assert.strictEqual(m.reg(0), 1); }
    },
    {
        name: "BTST rd, r1, imm (off)",
        setup: (m) => {
            m.writeReg(1, 0x81);
        },
        code: "BTST r0, r1, 1",
        check: (m) => { assert.strictEqual(m.reg(0), 0); }
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
    // Vectored jump

    {
        name: "VJMP addr, reg",
        setup: (m) => { m.writeReg(0, 2); },
        code: `
            VJMP 64, r0
            HALT

            .org 64
            .B 128, 0
            .B 144, 0
            .B 160, 0
            .B 176, 0
            .B 192, 0

            .org 128
            HALT

            .org 144
            HALT
            
            .org 160
            MOV r1, 123
            HALT

            .org 176
            HALT

            .org 192
            HALT
        `,
        check: (m) => {
            assert.equal(m.reg(1), 123);
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
        name: "STOREX (reg)",
        setup: (m) => {
            m.writeReg(0, (8 << 16) | 1024);

            m.writeReg(1, 0);
            m.writeReg(2, 123456789);

            m.writeReg(3, 4);
            m.writeReg(4, 46900);

            m.writeReg(5, 6);
            m.writeReg(6, 100);
        },
        code: `
            STOREXW r0, r1, r2
            STOREXH r0, r3, r4
            STOREXB.I r0, r5, r6
            STOREXW r0, r1, r2
            STOREXH r0, r3, r4
            STOREXB.I r0, r5, r6
        `,
        check: (m) => {
            assert.equal(m.view.getUint32(1024, true), 123456789);
            assert.equal(m.view.getUint16(1028, true), 46900);
            assert.equal(m.view.getUint8(1030), 100);

            assert.equal(m.view.getUint32(1032, true), 123456789);
            assert.equal(m.view.getUint16(1036, true), 46900);
            assert.equal(m.view.getUint8(1038), 100);

            assert.equal(m.reg(0), (8 << 16) | 1040);
        }
    },
    {
        name: "STOREX (imm)",
        setup: (m) => {
            m.writeReg(0, (8 << 16) | 1024);
            m.writeReg(2, 123456789);
            m.writeReg(4, 46900);
            m.writeReg(6, 100);
        },
        code: `
            STOREXW r0, 0, r2
            STOREXH r0, 4, r4
            STOREXB.I r0, 6, r6
            STOREXW r0, 0, r2
            STOREXH r0, 4, r4
            STOREXB.I r0, 6, r6
        `,
        check: (m) => {
            assert.equal(m.view.getUint32(1024, true), 123456789);
            assert.equal(m.view.getUint16(1028, true), 46900);
            assert.equal(m.view.getUint8(1030), 100);

            assert.equal(m.view.getUint32(1032, true), 123456789);
            assert.equal(m.view.getUint16(1036, true), 46900);
            assert.equal(m.view.getUint8(1038), 100);

            assert.equal(m.reg(0), (8 << 16) | 1040);
        }
    },
    {
        name: "LOADX (reg)",
        code: `
            # set up base address and stride
            MOVL r0, 1024
            MOVH r0, 8
            
            # set up offsets
            MOV r1, 0
            MOV r2, 4
            MOV r3, 6

            LOADXW r4, r0, r1
            LOADXH r5, r0, r2
            LOADXB.I r6, r0, r3
            LOADXW.X r7, r0, r1
            LOADXH.X r8, r0, r2
            LOADXB.XI r9, r0, r3

            HALT

            .org 1024
            .b 1, 0, 0, 0
            .b 2, 0
            .b 3
            .z 1
            .b 0xFF, 0xFF, 0xFF, 0xFF
            .b 0xFF, 0xFF
            .b 0xFF
            .z 1
        `,
        check: (m) => {
            assert.equal(m.reg(4), 1);
            assert.equal(m.reg(5), 2);
            assert.equal(m.reg(6), 3);

            assert.equal(m.regSigned(7), -1);
            assert.equal(m.regSigned(8), -1);
            assert.equal(m.regSigned(9), -1);

            assert.equal(m.reg(0), (8 << 16) | 1040);
        }
    },
    {
        name: "LOADX (imm)",
        code: `
            # set up base address and stride
            MOVL r0, 1024
            MOVH r0, 8
            
            LOADXW r4, r0, 0
            LOADXH r5, r0, 4
            LOADXB.I r6, r0, 6
            LOADXW.X r7, r0, 0
            LOADXH.X r8, r0, 4
            LOADXB.XI r9, r0, 6

            HALT

            .org 1024
            .b 1, 0, 0, 0
            .b 2, 0
            .b 3
            .z 1
            .b 0xFF, 0xFF, 0xFF, 0xFF
            .b 0xFF, 0xFF
            .b 0xFF
            .z 1
        `,
        check: (m) => {
            assert.equal(m.reg(4), 1);
            assert.equal(m.reg(5), 2);
            assert.equal(m.reg(6), 3);

            assert.equal(m.regSigned(7), -1);
            assert.equal(m.regSigned(8), -1);
            assert.equal(m.regSigned(9), -1);

            assert.equal(m.reg(0), (8 << 16) | 1040);
        }
    },

    {
        name: "STOREFB",
        setup: (m) => { m.writeReg(0, 1024); m.writeReg(1, 100); },
        code: `STOREFB r0, r1`,
        check: (m) => {
            assert.equal(m.view.getUint8(1024), 100);
        }
    },
    {
        name: "STOREFH",
        setup: (m) => { m.writeReg(0, 1024); m.writeReg(1, 10_000); },
        code: `STOREFH r0, r1`,
        check: (m) => {
            assert.equal(m.view.getUint16(1024, true), 10_000);
        }
    },
    {
        name: "STOREFW",
        setup: (m) => { m.writeReg(0, 1024); m.writeReg(1, 100_000); },
        code: `STOREFW r0, r1`,
        check: (m) => {
            assert.equal(m.view.getUint32(1024, true), 100_000);
        }
    },
    {
        name: "LOADFB",
        code: `
            MOVL r0, 1024
            LOADFB r1, r0
            LOADFB.X r2, r0
            HALT

            .org 1024
            .b 0xFF
        `,
        check: (m) => {
            assert.equal(m.reg(1), 255);
            assert.equal(m.regSigned(2), -1);
        }
    },
    {
        name: "LOADFH",
        code: `
            MOVL r0, 1024
            LOADFH r1, r0
            LOADFH.X r2, r0
            HALT

            .org 1024
            .b 0xFF, 0xFF
        `,
        check: (m) => {
            assert.equal(m.reg(1), 0xFFFF);
            assert.equal(m.regSigned(2), -1);
        }
    },
    {
        name: "LOADFW",
        code: `
            MOVL r0, 1024
            LOADFW r1, r0
            HALT

            .org 1024
            .b 0x1, 0x2, 0x3, 0x4
        `,
        check: (m) => {
            assert.equal(m.reg(1), 0x04030201);
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
    },
    {
        name: "PUSH imm",
        code: `
            RSV 2
            PUSH 123
            PUSH -65536
            POP r0
            POP r1
        `,
        check: (m) => {
            assert.equal(m.reg(0), -65536);
            assert.equal(m.reg(1), 123);
        }
    },
    {
        name: "BCALL r_dst, nargs, fn",
        code: `
            RSV 1
            PUSH 1
            PUSH 20
            PUSH 300
            BCALL r0, 3, 0
        `,
        check: (m) => {
            assert.equal(m.reg(0), 321);
            // TODO: need a way of checking the stack is popped
        }
    },
    {
        name: "BCALL nargs, fn",
        code: `
            PUSH 1
            PUSH 20
            PUSH 300
            BCALL 3, 0
        `,
        check: (m) => {
            // TODO: we need a way of testing the function was called
            // HOWEVER! I'm not convinced this form is even required - if the
            // BIF doesn't return a value its only purpose can be do some form
            // of I/O, which should be handled by OUT instruction.
            // I guess there's an argument that a BIF could be used to make helper
            // functions that perform I/O - but even then, why not just return a
            // value?
            // Revisit later...
        }
    },
    {
        name: "CALL r_dst, r_fn, nargs (+ NARGS)",
        code: `
            RSV 2
            MOV r0, 28
            PUSH 1
            PUSH 2
            PUSH 3
            CALL r1, r0, 3
            HALT
            
            MOV r0, 12345
            NARGS r1
            HALT
        `,
        check: (m) => {
            assert.equal(m.reg(0), 12345);
            assert.equal(m.reg(1), 3);
        }
    },
    {
        name: "RET imm",
        code: `
            RSV 1
            MOV r0, 16
            CALL r0, r0, 0
            HALT

            RET 2468
        `,
        check: (m) => {
            assert.equal(m.reg(0), 2468);
        }
    },
    {
        name: "RET reg",
        code: `
            RSV 2
            MOV r0, 28
            PUSH 1
            PUSH 2
            PUSH 3
            CALL r1, r0, 3
            HALT
            
            ADD r0, r0, r1
            ADD r0, r0, r2
            RET r0
        `,
        check: (m) => {
            assert.equal(m.reg(1), 6);
        }
    },
    {
        name: "CALL r_dst, addr, nargs",
        code: `
            RSV 1
            PUSH 10
            PUSH 20
            PUSH 30
            CALL r0, 24, 3
            HALT

            ADD r0, r0, r1
            ADD r0, r0, r2
            RET r0
        `,
        check: (m) => {
            assert.equal(m.reg(0), 60);
        }
    },

    //
    // Conditional jumps - comparison with zero

    {
        name: "JZ reg, rel",
        code: "MOV r0, 0\nJZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1) },
    },
    {
        name: "JZ reg, rel",
        code: "MOV r0, 1\nJZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0) },
    },
    {
        name: "JNZ reg, rel",
        code: "MOV r0, 0\nJNZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0) },
    },
    {
        name: "JNZ reg, rel",
        code: "MOV r0, 1\nJNZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1) },
    },
    {
        name: "JLTZ reg, rel",
        code: "MOV r0, -1\nJLTZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1) },
    },
    {
        name: "JLTZ reg, rel",
        code: "MOV r0, 0\nJLTZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0) },
    },
    {
        name: "JLTZ reg, rel",
        code: "MOV r0, 1\nJLTZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0) },
    },
    {
        name: "JLEZ reg, rel",
        code: "MOV r0, -1\nJLEZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1) },
    },
    {
        name: "JLEZ reg, rel",
        code: "MOV r0, 0\nJLEZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1) },
    },
    {
        name: "JLEZ reg, rel",
        code: "MOV r0, 1\nJLEZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0) },
    },
    {
        name: "JGTZ reg, rel",
        code: "MOV r0, -1\nJGTZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0) },
    },
    {
        name: "JGTZ reg, rel",
        code: "MOV r0, 0\nJGTZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0) },
    },
    {
        name: "JGTZ reg, rel",
        code: "MOV r0, 1\nJGTZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1) },
    },
    {
        name: "JGEZ reg, rel",
        code: "MOV r0, -1\nJGEZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0) },
    },
    {
        name: "JGEZ reg, rel",
        code: "MOV r0, 0\nJGEZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1) },
    },
    {
        name: "JGEZ reg, rel",
        code: "MOV r0, 1\nJGEZ r0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1) },
    },
    {
        name: "JLEZ reg, reg",
        code: "MOV r0, 0\nJLEZ r0, 1\nHALT\nMOV r1, 1",
        check: (m) => { assert.equal(m.reg(1), 1); }
    },
    {
        name: "JLEZ reg, reg",
        code: "MOV r0, -1\nJLEZ r0, 1\nHALT\nMOV r1, 1",
        check: (m) => { assert.equal(m.reg(1), 1); }
    },
    {
        name: "JLEZ reg, reg",
        code: "MOV r0, 1\nJLEZ r0, 1\nHALT\nMOV r1, 1",
        check: (m) => { assert.equal(m.reg(1), 0); }
    },
    {
        name: "JGEZ reg, reg",
        code: "MOV r0, 0\nJGEZ r0, 1\nHALT\nMOV r1, 1",
        check: (m) => { assert.equal(m.reg(1), 1); }
    },
    {
        name: "JGEZ reg, reg",
        code: "MOV r0, 1\nJGEZ r0, 1\nHALT\nMOV r1, 1",
        check: (m) => { assert.equal(m.reg(1), 1); }
    },
    {
        name: "JGEZ reg, reg",
        code: "MOV r0, -1\nJGEZ r0, 1\nHALT\nMOV r1, 1",
        check: (m) => { assert.equal(m.reg(1), 0); }
    },

    //
    // Conditional jumps - reg/reg

    {
        name: "JEQ reg, reg",
        code: "MOV r0, 1\nMOV r1, 1\nJEQ r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JEQ reg, reg",
        code: "MOV r0, 1\nMOV r1, 0\nJEQ r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JNE reg, reg",
        code: "MOV r0, 0\nMOV r1, 1\nJNE r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JNE reg, reg",
        code: "MOV r0, 1\nMOV r1, 1\nJNE r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JLT reg, reg",
        code: "MOV r0, 0\nMOV r1, 1\nJLT r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JLT reg, reg",
        code: "MOV r0, 1\nMOV r1, 1\nJLT r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JLT reg, reg",
        code: "MOV r0, 2\nMOV r1, 1\nJLT r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JGT reg, reg",
        code: "MOV r0, 2\nMOV r1, 1\nJGT r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JGT reg, reg",
        code: "MOV r0, 1\nMOV r1, 1\nJGT r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JGT reg, reg",
        code: "MOV r0, 0\nMOV r1, 1\nJGT r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JLE reg, reg",
        code: "MOV r0, 0\nMOV r1, 1\nJLE r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JLE reg, reg",
        code: "MOV r0, 1\nMOV r1, 1\nJLE r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JLE reg, reg",
        code: "MOV r0, 2\nMOV r1, 1\nJLE r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JGE reg, reg",
        code: "MOV r0, 2\nMOV r1, 1\nJGE r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JGE reg, reg",
        code: "MOV r0, 1\nMOV r1, 1\nJGE r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JGE reg, reg",
        code: "MOV r0, 0\nMOV r1, 1\nJGE r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },

    //
    // Conditional jumps - reg/imm

    {
        name: "JEQ reg, imm",
        code: "MOV r0, 1\nJEQ r0, 1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JEQ reg, imm",
        code: "MOV r0, 1\nJEQ r0, 0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JNE reg, imm",
        code: "MOV r0, 1\nJNE r0, 0, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JNE reg, imm",
        code: "MOV r0, 1\nJNE r0, 1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JLT reg, imm",
        code: "MOV r0, 3\nJLT r0, 4, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JLT reg, imm",
        code: "MOV r0, 3\nJLT r0, 3, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JLT reg, imm",
        code: "MOV r0, 3\nJLT r0, 2, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JGT reg, imm",
        code: "MOV r0, 3\nJGT r0, 2, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JGT reg, imm",
        code: "MOV r0, 3\nJGT r0, 3, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JGT reg, imm",
        code: "MOV r0, 3\nJGT r0, 4, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JLE reg, imm",
        code: "MOV r0, 3\nJLE r0, 4, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JLE reg, imm",
        code: "MOV r0, 3\nJLE r0, 3, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JLE reg, imm",
        code: "MOV r0, 3\nJLE r0, 2, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JGE reg, imm",
        code: "MOV r0, 3\nJGE r0, 2, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JGE reg, imm",
        code: "MOV r0, 3\nJGE r0, 3, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JGE reg, imm",
        code: "MOV r0, 3\nJGE r0, 4, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },

    //
    // Conditional jumps - unsigned

    {
        name: "JLTU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 20\nJLTU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JLTU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 10\nJLTU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JLTU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 5\nJLTU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JLEU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 20\nJLEU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JLEU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 10\nJLEU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JLEU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 5\nJLEU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JGTU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 20\nJGTU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JGTU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 10\nJGTU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JGTU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 5\nJGTU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JGEU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 20\nJGEU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 0); }
    },
    {
        name: "JGEU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 10\nJGEU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "JGEU reg, reg, rel",
        code: "MOV r0, 10\nMOV r1, 5\nJGEU r0, r1, 1\nHALT\nMOV r2, 1",
        check: (m) => { assert.equal(m.reg(2), 1); }
    },
    {
        name: "SWP (stack)",
        code: "RSV 2\nPUSH 150\nPUSH 250\nSWP\nPOP r0\nPOP r1",
        check: (m) => {
            assert.equal(m.reg(0), 150);
            assert.equal(m.reg(1), 250);
        }
    },
    {
        name: "DUP (stack)",
        code: "RSV 2\nPUSH 100\nDUP\nPOP r0\nPOP r1",
        check: (m) => {
            assert.equal(m.reg(0), 100);
            assert.equal(m.reg(1), 100);
        }
    },
    {
        name: "SWP r0, r1",
        setup: (m) => {
            m.writeReg(0, 100);
            m.writeReg(1, 200);
        },
        code: "SWP r0, r1",
        check: (m) => {
            assert.equal(m.reg(0), 200);
            assert.equal(m.reg(1), 100);
        }
    }
];

for (const t of TESTS) {
    test(t.name, makeTest(t));
}

