# Assembler

## Comments

Comments start with `;` and continue until the end of the line.

## Directives

### `.pushopt`, `.popopt`, `.setopt $K $V`

### `.define $NAME $EXPR`

Define `$NAME` as `$EXPR`.

`$NAME` follows same format as symbol. Defines override symbols when resolving? Or just don't allow conflicts?

### `.section $NAME`

Set linker output section; all code generated until next `.section` or `.org` directive is written to this section.

### `.org $ADDR`

Set output address to absolute value. Use this to place assembled output to fixed memory location, bypassing the linker. Error if emitted code overlaps with other code or anything placed by the linker.

### `.z $N`

Emit `$N` zeroes.

### `.b $ARG...`, `.h $ARG...`, `.w $ARG...`

Emit the given values as bytes, half-words, or words, respectively.

Values are literals, or any other constant expression. Expressions are evaluated
internally using signed 64 bit arithmetic, and then truncated to the required number
of bits.

For `.w` only, values may also be symbols. In this case, the symbol's address becomes
the value.

### `.align $N`

Align to the next multiple of `$N`, relative to the section start.

## Labels

`foo:` - creates a label which can be a target for jmp, function call etc.; exposed to linker to linker can fix up etc.

## Operations

Basic form:

```
$MNEMONIC(.$FLAGS)? (($ARG)(, $ARG)*)
```

Valid flags:

  - `X` - sign extend
  - `I` - post-increment
  - `D` - post-decrement

Examples:

```
PUSH 123
MOV r0, r1
ADD r0, r2, 10
STORE.B r0, r1
```

## Arguments

  - Named register: `$0`, `$1`, `$10` etc.
  - Immediate values: `123`, `0xFF`, `0b1010`, `-100`
  - Symbols: `foo`, `monkey`, `leopard`, `a_cookie`
  - Expressions

## Functions

A macro-style helper to define functions.

```
// $arg1, $arg2, $arg3 become aliased to $0, $1, $2
def my_function_name($arg1, $arg2, $arg3)
    // these locals are aliased to $3, $4, $5
    local $x, $y, $z

    add $x, $arg1, $arg2
    ret $x
end
```
expands to:

```
my_function_name:
RSV 6
// code emitted here
my_function_name_end:
```

Within a function, the auto-scratch syntax `{ ... }` may be used to simplify the
process of supplying temporary immediate values to register operands. For example,
instead of:

```
MOV $1, 8192
MEMSET $0, 0, $1
```

you can simply do:

```
MEMSET Rd, 0, {2048}
```

Using the auto-scratch syntax instructs the assembler to allocate a named scratch
register and emit additional instructions to set the correct values; the resulting
code will be similar to that in the first example, although extra instructions may
be required depending on the bit-width of the immediate value.

Multiple scratch braces can be used in a single instruction; the assembler will use
a different scratch register for each. Scratch registers are implemented as function
`local` variables named `$scratch0`, `$scratch1`, and so on - if a function already
defines locals with these names it will be assumed they are safe for auto-scratch use.

## Expressions

Constant expressions are allowed.

For now, no floating point.

Operators:

  - `+`, `-`, `*`, `/`, `%`
  - `>>`, `>>>`, `<<`
  - `&`, `|`, `^`, `~`
  - `>`, `>=`, `<`, `<=`, `==`
  - `&&`, `||`, `!`

For logical ops, false is `0`, true is `1`

## Future Features

  - static macro function calls (trig, logarithms)
  - repeat macro
    ```
    .repeat 1024 4 $i
    .repeat 1024 2 $j
    .define
    .end
    .end
    ```

