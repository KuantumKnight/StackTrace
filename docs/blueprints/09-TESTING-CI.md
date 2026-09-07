# Testing & CI Blueprint

## Unit tests
CFG:
- parser normalization
- invalid grammar errors
- derivation correctness
- FIRST/FOLLOW fixtures

PDA:
- transition matching
- epsilon transitions
- stack order
- final-state acceptance
- empty-stack acceptance
- dead branch detection
- nondeterministic branch count
- loop/safety-limit behavior

## Golden fixtures
Maintain known machines for:
- `a^n b^n`
- balanced parentheses
- palindromes with midpoint nondeterminism

## UI tests
- stepping changes selected configuration
- Back restores exact stack/input state
- clicking trace/tree node restores configuration
- rejected input shows reason

## CI
On each push/PR:
1. install dependencies
2. typecheck
3. unit tests
4. production build
