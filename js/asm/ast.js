export function isNumeric(astNode) {
    return astNode.type === "bin"
        || astNode.type === "hex"
        || astNode.type === "int";
}

