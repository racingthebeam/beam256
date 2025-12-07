import { Instructions } from "./instructions.js";
import { roundUpToNextMultipleOf } from "./helpers.js";
import * as O from "./optypes.js";

// typecheck checks the program for the following:
//
// 1. all instructions map to known instruction encodings, and operands are of
//    the correct type.
// 2. all referenced labels exist
// 3. correct alignment
//
// TODO: the AST currently discards all of the line/column information
// Need to bring this back so we can identify problem lines.
export function typecheck(prog) {
    let wp = 0;

    const state = {
        labels: prog.labels
    };

    // node.op, node.args
    function checkInstruction(node) {
        const forms = Instructions[node.op];
        if (!forms) {
            throw new Error(`Unknown instruction: ${node.op}`);
        }

        let foundMatch = false;

        // We have a list of candidate forms now.
        // Select the first one that matches our arguments.
        formLoop: for (const [i, c] of forms.entries()) {
            // if the argument counts aren't equal, can never match
            if (c.params.length !== node.args.length) {
                continue;
            }

            // check that each argument is assignable to the operand type
            for (let argIx = 0; argIx < node.args.length; argIx++) {
                const res = c.params[argIx].check(node.args[argIx], state);
                if (res === false || typeof res === 'string') {
                    continue formLoop;
                }
            }

            // if we find a match, annotate the AST node with the
            // entry and the index so we can look it up easily
            // during codegen
            node.instruction = c;
            node.instructionIndex = i;
            foundMatch = true;
            break;
        }

        if (!foundMatch) {
            // TODO: we should pretty print the literal + candidate forms
            // e.g.
            // found MOV <reg>, <reg>, <addr>, valid MOV forms are:
            // MOV <reg>, <reg>
            // MOV <reg>, <s17>
            // We can do this during the AST refactor...
            throw new Error(`no matching form for instruction ${node.op}`);
        }
    }

    for (const line of prog.lines) {
        switch (line.type) {
            case "ins":
                {
                    if (wp & 3) {
                        throw new Error("instruction alignment error");
                    }
                    checkInstruction(line);
                    wp += 4;
                    break;
                }
            case "dir-org":
                {
                    wp = line.addr;
                    break;
                }
            case "dir-zero":
                {
                    wp += line.count;
                    break;
                }
            case "dir-bytes":
                {
                    wp += line.values.length;
                    break;
                }
            case "dir-words":
                {
                    wp += line.values.length * 4;
                    break;
                }
            case "dir-align":
                {
                    wp = roundUpToNextMultipleOf(wp, line.align);
                    break;
                }
            case "label":
                {
                    // nothing to do, labels aren't interpreted.
                    break;
                }
            default:
                throw new Error(`unknown statement type ${line.type} - this is a bug`);
        }
    }
}

