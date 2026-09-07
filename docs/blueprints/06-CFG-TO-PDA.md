# CFG → PDA Blueprint

## Learning objective
Show the equivalence relationship as a construction process, not a black-box conversion.

## Construction presentation
1. Show source CFG.
2. Introduce PDA start/working/accept states.
3. Push the grammar start symbol.
4. For each production `A -> α`, add an epsilon transition that replaces `A` with `α`.
5. For each terminal `a`, add a transition that reads `a` when `a` is on top of the stack and removes it.
6. Add acceptance construction according to the selected convention.

## UI
A side panel lists construction rules and highlights the graph edges created by each rule. The student can move backward and forward through construction steps before running an input.

## Validation
Run the same set of bounded sample strings against derivation membership and generated PDA behavior to detect implementation errors during development.
