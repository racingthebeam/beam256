import { isNumeric } from "./ast.js";

//
//

class FlagSet {
    constructor(flagNames, length = null) {
        this.flagNames = flagNames.map(fn => fn.toUpperCase());
        if (length === null) length = flagNames.length;
        this.length = length;
    }

    check(ins) {
        for (const actualFlag of ins.flags) {
            if (this.flagNames.indexOf(actualFlag) < 0) {
                return `${actualFlag} is not a valid flag for ${ins.op}`;
            }
        }
        return true;
    }

    encode(flags) {
        let out = 0;
        this.flagNames.forEach((flag, ix) => {
            if (flags.has(flag)) {
                out |= (1 << ix);
            }
        });
        return out;
    }
}

export const FlagsMemX = new FlagSet(["X", "I"], 3);

//
//

class OpType {
    name = "";

    constructor(name) {
        this.name = name;
    }

    // check() checks the given AST node's assignability to the given type.
    // Returns true if given AST node can be legally assigned to this type.
    // Otherwise, returns a string describing the error.
    check(astNode, state) { return false; }
}



export const Addr = new class extends OpType {
    constructor() { super("addr"); }

    check(astNode, state) {
        if (isNumeric(astNode)) {
            // FIXME: we need to validate the address here
            // BUT I haven't yet worked out we're gonna deal with the
            // bank-switching shenanigans, so let's just punt it down
            // the road for now.
            return true;
        } else if (astNode.type === "ident") {
            if (!state.labels[astNode.name]) {
                return `Unknown label: ${astNode.name}`;
            }
            return true;
        } else {
            return "expected number or <ident>";
        }
    }
}

export const Reg = new class extends OpType {
    constructor() { super("reg"); }

    check(astNode, state) {
        if (astNode.type !== "reg") {
            return "expected <reg>";
        } else if (astNode.reg > 127) {
            return `invalid register number ${astNode.reg}`;
        }

        return true;
    }
}

export const RegAddr = new class extends OpType {
    constructor() { super("regaddr"); }

    check(astNode, state) {
        return astNode.type === "reg-addr";
    }
}

// Don't know if I need this?
//
// class BitPattern extends OpType {
//     constructor(bits) {
//         super("b" + bits);
//         this.bits = bits;
//
//     }
//
//     check(astNode, state) { return false; }
// }

class UnsignedInt extends OpType {
    constructor(bits) {
        super("u" + bits);
        this.bits = bits;
        this.min = 0;
        this.max = Math.pow(2, this.bits) - 1;
    }

    check(astNode, state) {
        if (!isNumeric(astNode)) {
            return "expected number";
        } else if (astNode.val < this.min || astNode.val > this.max) {
            return `value must be in the range ${this.min}..${this.max}`;
        } else {
            return true;
        }
    }
}

export const U5 = new UnsignedInt(5);
export const U7 = new UnsignedInt(7);
export const U8 = new UnsignedInt(8);
export const U10 = new UnsignedInt(10);
export const U12 = new UnsignedInt(12);
export const U14 = new UnsignedInt(14);
export const U16 = new UnsignedInt(16);

class SignedInt extends OpType {
    constructor(bits) {
        super("s" + bits);
        this.bits = bits;
        this.min = -Math.pow(2, bits - 1);
        this.max = Math.pow(2, bits - 1) - 1;
    }

    check(astNode, state) {
        if (!isNumeric(astNode)) {
            return "expected number";
        } else if (astNode.val < this.min || astNode.val > this.max) {
            return `value must be in the range ${this.min}..${this.max}`;
        } else {
            return true;
        }
    }
}

export const S17 = new SignedInt(17);

