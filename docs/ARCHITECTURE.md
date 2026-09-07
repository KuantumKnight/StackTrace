# StackTrace Architecture

## Architectural rule

Simulation logic and visualization must be separated. The core engine emits immutable configurations/trace events; the UI renders those records and never mutates machine semantics directly.

## Layers

### 1. Domain model
- CFG: productions, terminals, non-terminals, start symbol.
- PDA: states, transitions, start state, accepting states, initial stack symbol.
- Configuration: state, input index, stack, parent, transition, status.
- Trace: ordered transition records.

### 2. CFG engine
- Grammar parser and validation.
- Leftmost/rightmost derivation.
- Parse tree construction.
- FIRST/FOLLOW.
- Left recursion detection/removal.
- Left factoring.
- CFG → PDA conversion.

### 3. PDA engine
- Deterministic/nondeterministic transition matching.
- Epsilon transitions.
- Final-state/empty-stack acceptance.
- Branch expansion.
- Visited configuration detection.
- Safety limits.
- Rejection analysis.

### 4. State/trace store
- Current machine definition.
- Current input.
- Execution graph.
- Selected configuration.
- History/time travel.
- Tests and challenge state.

### 5. Visualization
- PDA graph.
- Stack animation.
- Execution tree.
- Trace table.
- Parse tree.
- Derivation sequence.

### 6. Persistence/share layer
MVP: browser localStorage.
Later: serialized URL/share payloads or backend storage if classroom accounts are added.

## Invariants
1. Core functions are pure where possible.
2. Every UI state shown during simulation maps to a stored `Configuration`.
3. Every branch has a parent configuration except the root.
4. Rejection is not emitted when execution stops because of a safety limit.
5. Epsilon loops are detected using state + input index + stack contents.
6. Visual animation never decides acceptance.
