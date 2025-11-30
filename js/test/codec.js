import { test } from "node:test";
import * as assert from "node:assert";

import { encodeS17 } from "../asm/codec.js";

test("encodeS17", () => {
    assert.strictEqual(encodeS17(100), 100);
    assert.strictEqual(encodeS17(-65536), 0x10000);
    assert.strictEqual(encodeS17(-1), 0x1FFFF);
});

