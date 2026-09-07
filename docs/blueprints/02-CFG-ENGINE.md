# CFG Engine Blueprint

## Input syntax
Support `->` and `→`; alternatives separated by `|`; epsilon normalized to `ε`.

Example:
`S -> aSb | ε`

## Parser output
`Grammar { startSymbol, productions, terminals, nonTerminals }`

## Diagnostics
- Empty grammar.
- Missing arrow.
- Empty LHS.
- Multiple symbols on LHS when only CFG syntax is allowed.
- Undefined non-terminal warning.
- Unreachable/non-generating symbol warning.

## Derivation engine
State = current sentential form + production used + replaced position.

Leftmost:
1. Find first non-terminal.
2. Enumerate productions for it.
3. Choose a branch or search toward target input.

Rightmost is symmetrical.

For target-string derivation, use bounded search with pruning based on terminal-prefix incompatibility and maximum sentential length.

## Parse tree
Build tree nodes as derivation replacements occur. Preserve derivation node IDs so clicking a derivation step highlights corresponding tree nodes.

## Analysis
FIRST/FOLLOW should operate on normalized token symbols rather than raw characters once multi-character terminals such as `id` are supported.
