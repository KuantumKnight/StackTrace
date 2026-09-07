# State, Persistence & Sharing Blueprint

## Client state slices
- workspace definition
- grammar editor
- PDA editor
- simulation graph
- selected configuration
- UI layout
- tests
- challenge progress

## Persistence
MVP uses localStorage with a versioned serialized schema.

Never persist transient animation state.

## Share format
A share payload should contain only declarative inputs:
- grammar
- PDA
- acceptance mode
- optional input/test cases

Do not serialize execution history; recompute it from the deterministic engine version.
