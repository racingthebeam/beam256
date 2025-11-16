//
// Tokens

const T_DIRECTIVE = Symbol("directive");
const T_LABEL = Symbol("label");
const T_COMMA = Symbol("comma");
const T_MINUS = Symbol("minus");
const T_REGADDR = Symbol("regaddr");
const T_REG = Symbol("reg");
const T_HEX = Symbol("hex");
const T_BIN = Symbol("bin");
const T_INT = Symbol("int");
const T_IDENT = Symbol("ident");
const T_NL = Symbol("<nl>");
const T_EOF = Symbol("<eof>");

const TokenNames = {
    [T_DIRECTIVE]: "DIRECTIVE",
    [T_LABEL]: "LABEL",
    [T_COMMA]: "COMMA",
    [T_MINUS]: "MINUS",
    [T_REGADDR]: "REGADDR",
    [T_REG]: "REG",
    [T_HEX]: "HEX",
    [T_BIN]: "BIN",
    [T_INT]: "INT",
    [T_IDENT]: "IDENT",
    [T_NL]: "NL",
    [T_EOF]: "EOF",
};

function tokenName(tok) {
    if (Array.isArray(tok)) tok = tok[0];
    return TokenNames[tok] || "UNKNOWN";
}

const registerReference = /^r[0-9]+$/;

export function parse(text) {
    const tokenizer = createTokenizer(text + "\n");
    let curr = tokenizer.next();

    function throwWithLine(tok, msg) {
        throw new Error(`Line ${tok[2]}: ${msg}`)
    }

    function at(tok) {
        return curr[0] === tok;
    }

    function accept(tok) {
        if (tok && tok !== curr[0]) {
            throwWithLine(curr, `Expected ${tokenName(tok)}, found ${tokenName(curr[0])}`);
        }
        curr = tokenizer.next();
    }

    function parseDirective() {
        if (!at(T_DIRECTIVE)) {
            throwWithLine(curr, `Unexpected token ${tokenName(curr)} while attempting to parse directive, expected ${tokenName(T_DIRECTIVE)}`);
        }

        const dir = directive(curr[1]).toUpperCase();
        accept();

        let out = {};

        switch (dir) {
            case "ORG":
                out = {
                    type: "dir-org",
                    addr: parsePositiveNumber()
                };
                break;
            case "Z":
                out = {
                    type: "dir-zero",
                    count: parsePositiveNumber()
                };
                break;
            case "B":
            case "W":
                {
                    // FIXME: this is most definitely wrong in JavaScript
                    const max = (dir === "B") ? 255 : 0xFFFFFFFF;

                    const vals = [];
                    while (!at(T_NL)) {
                        if (vals.length > 0) {
                            accept(T_COMMA);
                        }
                        const val = parsePositiveNumber();
                        if (val.val > max) {
                            throwWithLine(curr, `Invalid value for directive ${dir} (max=${max})`);
                        }
                        vals.push(val);
                    }

                    if (vals.length === 0) {
                        throwWithLine(curr, `Literal data must have at least one entry`);
                    }

                    out = {
                        type: `dir-${dir === "B" ? "bytes" : "words"}`,
                        values: vals
                    };

                    break;
                }
            case "ALIGN":
                out = {
                    type: "dir-align",
                    addr: parsePositiveNumber()
                };
                break;
            default:
                throwWithLine(curr, `Unknown directive: ${dir}`);
        }

        return out;
    }

    function parseInstruction() {
        if (!at(T_IDENT)) {
            throwWithLine(curr, `Unexpected token ${tokenName(curr)} while attempting to parse instruction, expected ${tokenName(T_IDENT)}`);
        }

        const op = curr[1].toUpperCase();
        accept();

        const args = [];
        while (!at(T_NL)) {
            if (args.length > 0) {
                accept(T_COMMA);
            }
            args.push(parseOperand());
        }

        return { type: 'ins', op: op, args: args };
    }

    function parsePositiveNumber() {
        let out = null;

        switch (curr[0]) {
            case T_HEX:
                out = { type: 'hex', str: curr[1], val: hexVal(curr[1]) };
                break;
            case T_BIN:
                out = { type: 'bin', str: curr[1], val: binVal(curr[1]) };
                break;
            case T_INT:
                out = { type: 'int', str: curr[1], val: intVal(curr[1]), negative: false };
                break;
            default:
                throwWithLine(curr, `Unexpected token ${tokenName(curr)} while parsing number`);
        }

        accept();
        return out;
    }

    function parseOperand() {
        let negate = false;
        if (at(T_MINUS)) {
            negate = true;
            accept();
            if (!at(T_INT)) {
                throwWithLine(curr, `Unexpected token ${tokenName(curr)}, expected ${tokenName(T_IDENT)}`);
            }
        }

        let out;

        switch (curr[0]) {
            case T_REGADDR:
                out = { type: 'reg-addr', reg: reg(curr[1]) };
                break;
            case T_REG:
                out = { type: 'reg', reg: reg(curr[1]) };
                break;
            case T_HEX:
            case T_BIN:
            case T_INT:
                {
                    const out = parsePositiveNumber();
                    if (out.type === "int" && negate) {
                        out.str = "-" + out.str;
                        out.val *= -1;
                        out.negative = true;
                    }
                    return out;
                }
            case T_IDENT:
                out = { type: 'ident', val: curr[1] };
                break;
            default:
                throwWithLine(curr, `Unexpected token ${tokenName(curr)} while attempting to parse operand`);
        }

        accept();

        return out;
    }

    function parseLine() {
        if (at(T_LABEL)) {
            const name = label(curr[1]);
            // TODO: hook up the label to whatever...
            accept();
            if (at(T_NL)) {
                accept();
                return;
            }
        }

        let out;

        if (at(T_DIRECTIVE)) {
            out = parseDirective();
        } else if (at(T_IDENT)) {
            out = parseInstruction();
        } else {
            throwWithLine(curr, `Unexpected token ${tokenName(curr)}`);
        }

        accept(T_NL);

        return out;
    }

    const lines = [];

    while (!at(T_EOF)) {
        // skip blank lines
        if (at(T_NL)) {
            accept();
            continue;
        }
        lines.push(parseLine());
    }

    return lines;
}

function createTokenizer(text) {
    // regex for matching all of the non-comment/whitespace/newline tokens
    const matcher = /(\.[a-z]+|[a-z_][a-z0-9_]*:|,|-|\[r\d+\]|r\d+|0x[0-9a-f_]+|0b[01_]+|[0-9_]+|[a-z][a-z0-9_]*)/iy;

    let rp = 0;
    let line = 1;

    // skip whitespace and comments
    // don't skip newlines, since these are tokens
    function skip() {
        while (true) {
            if (space_p(text[rp])) {
                rp++;
            } else if (text[rp] === '#') {
                rp++;
                while (rp < text.length && text[rp] !== '\r' && text[rp] !== '\n') {
                    rp++;
                }
            } else {
                break;
            }
        }
    }

    function nextToken() {
        matcher.lastIndex = rp;
        const m = matcher.exec(text);
        if (m === null) {
            throw new Error(`tokenization error on line ${line}`);
        }
        rp = matcher.lastIndex;
        return m[1];
    }

    function next() {
        if (rp >= text.length) {
            return [T_EOF, null];
        }

        // Newlines
        if (text[rp] === '\r') {
            rp++;
            if (text[rp] === '\n') {
                rp++;
            }
            skip();
            line++;
            return [T_NL, "\n"];
        } else if (text[rp] === '\n') {
            rp++;
            skip();
            line++;
            return [T_NL, "\n"];
        }

        const raw = nextToken();
        skip();

        if (raw[0] === '.') {
            return [T_DIRECTIVE, raw];
        } else if (raw[raw.length - 1] === ':') {
            return [T_LABEL, raw];
        } else if (raw === ',') {
            return [T_COMMA, raw];
        } else if (raw === '-') {
            return [T_MINUS, raw];
        } else if (raw[0] === '[') {
            return [T_REGADDR, raw];
        } else if (raw.startsWith("0x")) {
            return [T_HEX, raw];
        } else if (raw.startsWith("0b")) {
            return [T_BIN, raw];
        } else if (digit_p(raw[0])) {
            return [T_INT, raw];
        } else if (raw.match(registerReference)) {
            return [T_REG, raw];
        } else {
            return [T_IDENT, raw];
        }
    }

    skip();

    return {
        next() {
            // LOL
            const currentLine = line;
            const out = next();
            out.push(currentLine);
            return out;
        }
    }
}

// extract register number from either "rX" or "[rX]"
function reg(str) {
    if (str[0] === "[") {
        return parseInt(str.substring(2, str.length - 1));
    } else {
        return parseInt(str.substring(1), 10);
    }
}

// extract label name from "label:" => "label"
function label(str) { return str.substring(0, str.length - 1); }

// extract directive name from ".directive" => "directive"
function directive(str) { return str.substring(1); }

function intVal(str) { return parseInt(ru(str), 10); }
function binVal(str) { return parseInt(ru(str.substring(2)), 2); }
function hexVal(str) { return parseInt(ru(str.substring(2)), 16); }

// remove underscores
function ru(s) { return s.replaceAll("_", ""); }

function digit_p(ch) {
    return ch >= '0' && ch <= '9';
}

function space_p(ch) {
    // This will do for now, there's probably some unicode bullshit
    // to deal with.
    return ch == ' ' || ch == '\t';
}
