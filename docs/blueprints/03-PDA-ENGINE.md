# PDA Engine Blueprint

## Transition semantics
Canonical label:
`input, stack_top -> stack_replacement`

Each transition may consume an input symbol or epsilon. It may require/pop a stack-top symbol or use epsilon. Replacement is pushed so the leftmost replacement symbol becomes the new top in the current implementation.

## Configuration
- state
- immutable original input
- input index
- stack array with top at index 0
- parent configuration ID
- transition ID
- depth
- status

## NPDA algorithm
Use breadth-first search for user-facing execution because it naturally exposes shallow branches first.

For each active configuration:
1. Find all outgoing transitions.
2. Filter by next input and stack top.
3. Apply all matches.
4. Create one child configuration per match.
5. Evaluate acceptance.
6. If there are no matches, mark dead.

## Safety
Visited key: `state | inputIndex | stackContents`.
Limits:
- branch/configuration count
- depth
- stack height

Limit exhaustion must return `LIMIT`, not `REJECTED`.

## Acceptance
Final-state mode: all input consumed and current state accepting.
Empty-stack mode: all input consumed and stack empty.
