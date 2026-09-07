# StackTrace

**Visual debugging for context-free grammars and pushdown automata.**

StackTrace is an interactive Models of Computation learning tool for exploring CFGs, CFG analysis, CFG → PDA construction, PDA/NPDA execution, stack behavior, nondeterministic branches, rejection causes, and repair challenges.

> Product principle: every result should be **explainable, reversible, and debuggable**.

## Live app

- **Vercel:** https://stacktrace-ashen.vercel.app/
- **GitHub Pages:** https://kuantumknight.github.io/StackTrace/

Both deployments are built from the same `main` branch.

## What StackTrace can do

### CFG laboratory

- Live CFG editor and parser diagnostics
- Leftmost and rightmost bounded derivation search
- Step-by-step derivation inspector
- Animated parse-tree reconstruction
- FIRST and FOLLOW sets
- Nullable-variable analysis
- Undefined, unreachable, and non-generating-variable diagnostics
- Direct left-recursion detection and removal
- Left-factoring detection and transformation
- Bounded ambiguity-witness search with explicit non-proof semantics

### CFG → PDA

- Progressive construction walkthrough
- Variable-replacement ε-transitions
- Terminal-matching transitions
- Construction-step highlighting
- Bounded source/generated-machine verification
- Open the generated PDA directly in the debugger

### PDA / NPDA debugger

- Draggable PDA designer
- Create/delete states and transitions
- Start-state and accepting-state controls
- Machine validation diagnostics
- Animated state graph and active-transition flow
- Symbol-by-symbol input tape
- Animated stack push/pop/replace telemetry
- Final-state and empty-stack acceptance
- Run, pause, step, reset, and playback speed controls
- **True Back/Forward time travel** without destroying future configurations
- Execution trace and clickable stack-height timeline
- Bounded NPDA execution tree with ε-loop, depth, node, and stack-depth limits
- Click any branch to restore its exact configuration path
- Hide dead branches and focus the shortest accepting path
- Branch-level rejection diagnostics
- **Whole-NPDA verdicts** that distinguish:
  - another branch accepts,
  - every explored branch rejects,
  - search is inconclusive because a safety limit was reached

### Learn and Examples

- Guided Learn Center connecting CFG, PDA, stack memory, nondeterminism, and debugging
- Interactive **PDA vs DFA** experiment showing why finite-state memory cannot recognize `aⁿbⁿ`
- Verified built-in examples:
  - `aⁿbⁿ`
  - balanced parentheses
  - even palindromes with midpoint nondeterminism
- Named local workspace saves for classroom checkpoints

### Test Bench and Challenges

- Batch assertions using:

  ```text
  accept "aabb"
  reject "aabbb"
  ```

- Failed assertions can jump directly into the debugger
- Seven-level PDA Repair Lab progression
- Public and hidden language tests
- Required acceptance convention per challenge
- Hint penalty and 100-point scoring

### Persistence and sharing

- Versioned local autosave
- Shareable URL/payload import-export
- Execution history is recomputed rather than serialized
- Reduced-motion support, keyboard focus styling, skip navigation, and responsive layouts

## Keyboard controls

| Shortcut | Action |
| --- | --- |
| `Space` | Step one configuration |
| `Shift + Space` | Run / pause |
| `Alt + Left` | Previous configuration |
| `Alt + Right` | Next configuration |
| `R` | Reset current input |

Keyboard shortcuts are ignored while typing inside form controls.

## Quick start

Requires Node.js 22.

```bash
git clone https://github.com/KuantumKnight/StackTrace.git
cd StackTrace
npm ci
npm run dev
```

Open the local Vite URL shown in the terminal.

### Validate the release

```bash
npm ci
npm test
npm run typecheck
npm run build
```

Dependencies are pinned and `package-lock.json` is committed. CI and GitHub Pages use `npm ci`, so clean installs reproduce the same dependency graph.

## Recommended 90-second classroom demo

Use the grammar:

```text
S -> aSb | ε
```

and input:

```text
aaabbb
```

Then show:

1. the CFG and a leftmost derivation,
2. the animated parse tree,
3. CFG → PDA construction,
4. the generated PDA in the debugger,
5. stack growth while reading `a`,
6. the nondeterministic phase switch,
7. stack discharge while reading `b`,
8. the NPDA execution tree,
9. Back/Forward time travel,
10. a wrong input such as `aabbb` and the whole-NPDA rejection explanation.

See `docs/CLASSROOM_DEMO.md` for a presentation script.

## Architecture

The important architectural boundary is:

```text
Formal engine
    ↓
Configurations / trace events
    ↓
Debugger state
    ↓
Visualization
```

Simulation logic is kept separate from animation. A UI animation cannot change the mathematical result of a computation.

## Automated quality gate

Every push to `main` and every pull request runs:

1. locked dependency installation with `npm ci`,
2. CFG/PDA/NPDA unit and regression tests,
3. browser-style jsdom integration tests,
4. TypeScript typecheck,
5. production Vite build,
6. production artifact upload.

The release workflow independently repeats the locked install, tests, typecheck, and build before publishing `dist/` to `gh-pages`.

## Project documentation

- `docs/StackTrace_CFG_PDA_Project_Detailed.txt` — original project specification
- `docs/ARCHITECTURE.md` — engine/UI architecture and invariants
- `docs/IMPLEMENTATION_ROADMAP.md` — implementation status and optional future directions
- `docs/CLASSROOM_DEMO.md` — short classroom presentation flow
- `docs/RELEASE_CHECKLIST.md` — release verification checklist
- `docs/blueprints/` — detailed implementation blueprints

## Release status

StackTrace is at **v1.0.0 scope**. The original MVP plus the identified post-MVP learning/debugging gaps are implemented. Remaining ideas in the roadmap are optional research or scale extensions rather than unfinished baseline work.
