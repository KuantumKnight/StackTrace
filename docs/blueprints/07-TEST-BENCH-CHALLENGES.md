# Test Bench & Challenge Blueprint

## Test bench syntax
`accept "aabb"`
`reject "aabbb"`

## Result table
- input
- expected
- actual
- status
- configurations explored
- terminal reason

Clicking a failed test loads it into the debugger at the closest failing branch.

## Challenge schema
- id/title/difficulty
- concept tags
- starting grammar/PDA
- expected language or hidden validator
- public tests
- hints
- completion condition

## Challenge types
- missing epsilon transition
- incorrect push
- incorrect pop
- wrong accepting state
- wrong acceptance mode
- nondeterministic branch bug
- CFG → PDA construction bug

Challenges should test debugging, not obscure syntax.
