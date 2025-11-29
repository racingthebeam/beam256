import { test } from "node:test";
import * as assert from "node:assert";

import { createMachine } from "../emu/machine.js";
import { assemble } from "../asm/index.js";

function makeTest({ setup, code, check, halt = true }) {
    return async (t) => {
        if (halt) code += "\nHALT\n";

        const machine = await createMachine({
            onEvent: () => {
                // console.log("event!");
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
            check(machine);
        }
    };
}

// If we can get this test passing today, it will be a victory.
const TESTS = [
    {
        name: "MOV rd, rs",
        setup: (machine) => { machine.writeReg(1, 150); },
        code: "MOV r0, r1",
        check: (machine) => { assert.strictEqual(machine.reg(0), 150); }
    }
];

for (const t of TESTS) {
    test(t.name, makeTest(t));
}

