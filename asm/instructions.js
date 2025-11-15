// Argument types:
// reg - register reference (7-bit, 0-127)
// s17 - signed 17 bit number 
// addr - 16-bit absolute address
// raddr - indirect address from register (7-bit, 0-127)
// rel - 8-bit instruction relative address (-128 - 127)
// u16 - 16-bit unsigned value
// u8 - 8-bit unsigned value

export const Instructions = {
    //
    // Get/Set

    "MOV": [
        {
            // Args denotes the order as written by humans in assembly code
            // This doesn't always match the order in which they're encoded
            // because the human-written representation favours destination-
            // first, whereas the native representation is chosen so as to
            // minimise the total number of encodings.
            args: ["reg", "reg"],

            // This defines how the instructions are encoded
            // If encoding order matches the argument order, this can be
            // omitted/set to null
            enc: null,
        },
        {
            args: ["reg", "s17"],
        }
    ],
    "MOVH": [
        {
            args: ["reg", "u16"]
        },
    ],
    "MOVL": [
        {
            args: ["reg", "u16"]
        }
    ],
    "STORE": [
        {
            args: ["addr", "reg"]
        },
        {
            args: ["raddr", "reg"]
        }
    ],
    "LOAD": [
        {
            args: ["reg", "addr"],
            enc: [1, 0]
        },
        {
            args: ["reg", "raddr"]
        }
    ]
}
