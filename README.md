# StackTrace

Interactive CFG and Pushdown Automata debugger for learning context-free languages by stepping through derivations and PDA computations.

## Product principle

Every result should be **explainable, reversible, and debuggable**.

## Current implementation

- Dark, responsive developer-tool workspace
- CFG editor with live grammar parsing
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
- Architecture and implementation blueprints in `docs/blueprints/`
- Original project specification preserved in `docs/StackTrace_CFG_PDA_Project_Detailed.txt`

## Run locally

```bash
npm install
npm run dev
```

## Main implementation phases

1. CFG derivation explorer + parse tree
2. Graphical PDA designer + transition editor
3. CFG → PDA construction walkthrough
4. FIRST/FOLLOW + grammar transformations
5. Language test bench
6. Challenge mode + sharing

See `docs/IMPLEMENTATION_ROADMAP.md` for commit-sized work units.
