# StackTrace

Interactive CFG and Pushdown Automata debugger for learning context-free languages by stepping through derivations and PDA computations.

## Product principle

Every result should be **explainable, reversible, and debuggable**.

## Current implementation

- Dark, responsive developer-tool workspace
- CFG editor with live grammar parsing
- Leftmost and rightmost bounded derivation search
- Step-by-step derivation inspector with replaced-variable highlighting
- Live parse-tree reconstruction and animation
- Progressive CFG → PDA construction walkthrough
- Generated PDA can be opened directly in the debugger
- Branching NPDA sample for `a^n b^n`
- Animated PDA graph with active-state radar and transition flow
- Symbol-by-symbol input tape with moving read head
- Animated stack memory with push/pop telemetry
- Run, pause, step, reset, speed control, and time travel
- Final-state and empty-stack acceptance modes
- Clickable stack-height timeline
- Clickable execution trace with operation semantics
- Bounded NPDA execution-tree search with active/accepted/dead/limit branches
- Rejection diagnostics and branch-limit explanations
- Batch language test bench with `accept` / `reject` assertions
- Failed tests can jump directly into the debugger
- GitHub Actions clean-install + production-build verification
- Architecture and implementation blueprints in `docs/blueprints/`
- Original project specification preserved in `docs/StackTrace_CFG_PDA_Project_Detailed.txt`

## Run locally

```bash
npm install
npm run dev
```

## Next implementation phases

1. Graphical PDA designer + transition editor
2. FIRST/FOLLOW + grammar transformations
3. Better branch selection/time-travel across the full NPDA tree
4. Challenge mode
5. Local persistence and shareable configurations
6. Deployment and classroom polish

See `docs/IMPLEMENTATION_ROADMAP.md` for commit-sized work units.
