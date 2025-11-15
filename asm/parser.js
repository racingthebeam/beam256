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

const registerReference = /^r[0-9]+$/;

export function parse(text) {
    const tok = tokenizer(text);

    let curr = tok.next();
    while (curr[0] !== T_EOF) {
        console.log(curr);
        curr = tok.next();
    }
}

function tokenizer(text) {
    // regex for matching all of the non-comment/whitespace/newline tokens
    const matcher = /(\.[a-z]+|[a-z_][a-z0-9_]*:|,|-|\[r\d+\]|r\d+|0x[0-9a-f_]+|0b[01_]+|[0-9_]+|[a-z][a-z0-9_]*)/iy;

    let rp = 0;

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
            throw new Error("tokenization error");
        }
        rp = matcher.lastIndex;
        return m[1];
    }

    skip();

    return {
        next() {
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
                return [T_NL, "\n"];
            } else if (text[rp] === '\n') {
                rp++;
                skip();
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
        },

        end() {
            return rp >= text.length;
        }
    }
}

function digit_p(ch) {
    return ch >= '0' && ch <= '9';
}

function space_p(ch) {
    // This will do for now, there's probably some unicode bullshit
    // to deal with.
    return ch == ' ' || ch == '\t';
}
