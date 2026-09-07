# StackTrace

Interactive CFG and Pushdown Automata debugger for learning context-free languages by stepping through derivations, constructions, machine branches, and failures.

## Product principle

Every result should be **explainable, reversible, and debuggable**.

## Implemented

### CFG laboratory
- Live CFG editor and parser diagnostics
- Leftmost and rightmost bounded derivation search
- Step-by-step derivation inspector
- Animated parse-tree reconstruction
- FIRST and FOLLOW sets
- Nullable-variable analysis
- Undefined, unreachable, and non-generating variable diagnostics
- Direct left-recursion detection and removal
- Left-factoring detection and transformation
- Bounded ambiguity-witness search with explicit non-proof semantics

### CFG → PDA
- Progressive construction walkthrough
- Variable-replacement ε-transitions
- Terminal-matching transitions
- Construction-step highlighting
- Bounded source/generated-machine equivalence check
- Open generated PDA directly in the debugger

### PDA / NPDA debugger
- Draggable PDA designer
- State creation/deletion and start/final-state controls
- Transition creation/edit/delete
- Machine validation diagnostics
- Animated state graph and active transition flow
- Symbol-by-symbol input tape
- Animated stack push/pop/replace telemetry
- Final-state and empty-stack acceptance
- Run, pause, step, back, reset, and playback speed
- Keyboard controls: `Space` step, `Shift+Space` run/pause, `Alt+Left` back, `R` reset
- Execution trace and clickable stack-height timeline
- Bounded NPDA execution tree with ε-loop, depth, node, and stack-depth safety limits
- Click any branch to restore its exact path in the debugger
- Hide dead branches and focus the shortest accepting path
- Rejection diagnostics with blocking transition context

### Testing, repair, and sharing
- Batch language Test Bench using `accept "..."` / `reject "..."`
- Failed assertions jump directly into the debugger
- Repair-lab Challenges with public/hidden tests, hints, acceptance conventions, and a 100-point score
- Versioned local autosave
- Shareable URL/payload import-export; execution history is recomputed rather than serialized
- Vitest regression coverage for CFG, PDA, NPDA limits, challenge validation, and persistence
- GitHub Actions clean install → tests → typecheck/production build → build artifact

## Run locally

```bash
npm install
npm run dev
```

Validation:

```bash
npm test
npm run typecheck
npm run build
```

## Project documentation

- `docs/StackTrace_CFG_PDA_Project_Detailed.txt` — original project specification
- `docs/ARCHITECTURE.md` — engine/UI architecture and invariants
- `docs/IMPLEMENTATION_ROADMAP.md` — original commit-sized roadmap and completion status
- `docs/blueprints/` — detailed implementation blueprints

The original MVP roadmap is implemented. Further work should be treated as post-MVP expansion rather than unfinished baseline scope.
