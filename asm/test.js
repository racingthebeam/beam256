import { parse } from "./parser.js";
import * as fs from "fs";

const code = fs.readFileSync("../examples/test.b2", "utf8");

parse(code);
