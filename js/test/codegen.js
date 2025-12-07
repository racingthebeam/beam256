import { test } from "node:test";
import * as assert from "node:assert";

import { assemble } from "../asm/index.js";

function makeTest({ code, check }) {
    return (t) => {
        const image = assemble(code);

        if (typeof check === 'function') {
            check(image);
        }
    };
}

const TESTS = [
    {
        name: "org",
        code: `
            .org 4
            .b 1
        `,
        check: (img) => {
            assert.equal(0, img[0]);
            assert.equal(0, img[1]);
            assert.equal(0, img[2]);
            assert.equal(0, img[3]);
            assert.equal(1, img[4]);
        }
    },
    {
        name: "align",
        code: `
            .b 1
            .align 4
            .b 2
        `,
        check: (img) => {
            assert.equal(1, img[0]);
            assert.equal(0, img[1]);
            assert.equal(0, img[2]);
            assert.equal(0, img[3]);
            assert.equal(2, img[4]);
        }
    },
    {
        name: "bytes",
        code: ".b 1, 2, 3, 4",
        check: (img) => {
            assert.equal(1, img[0]);
            assert.equal(2, img[1]);
            assert.equal(3, img[2]);
            assert.equal(4, img[3]);
        }
    },
    {
        name: "words",
        code: ".w 1, 2, 3, 4",
        check: (img) => {
            for (let i = 0; i < 4; i++) {
                const base = i * 4;
                assert.equal(i + 1, img[base + 0]);
                assert.equal(0, img[base + 1]);
                assert.equal(0, img[base + 2]);
                assert.equal(0, img[base + 3]);
            }
        }
    },
];

for (const t of TESTS) {
    test(t.name, makeTest(t));
}

