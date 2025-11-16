import { parse } from "./parser.js";
import * as fs from "fs";

const code = fs.readFileSync("../examples/test.b2", "utf8");

const prog = parse(code);

console.log(JSON.stringify(prog, null, 2));
