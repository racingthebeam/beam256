import { parse } from "./parser.js";
import { typecheck } from "./typecheck.js";
import * as fs from "fs";

const code = fs.readFileSync("../examples/test.b2", "utf8");

const prog = parse(code);

try {
    typecheck(prog);
} catch (err) {
    console.error(`typechecking failed: ${err.message}`);
}
