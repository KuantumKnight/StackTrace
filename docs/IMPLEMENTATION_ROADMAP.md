# Implementation Roadmap — MVP completion status

The original commit-sized MVP roadmap is complete on `main`. The checklist below preserves the planned scope and records its implementation status.

## Phase 0 — repository foundation
- [x] `chore: initialize Vite React TypeScript app`
- [x] `docs: add original StackTrace project specification`
- [x] `docs: add architecture and implementation blueprints`
- [x] `style: add developer-tool workspace shell`

## Phase 1 — CFG editor
- [x] `feat(cfg): add grammar parser`
- [x] `feat(cfg): validate production syntax`
- [x] `feat(cfg): detect terminals and non-terminals`
- [x] `feat(cfg): add grammar diagnostics panel`
- [x] `feat(cfg): add leftmost derivation engine`
- [x] `feat(cfg): add rightmost derivation engine`
- [x] `feat(cfg): add derivation stepper`
- [x] `feat(cfg): add parse tree model`
- [x] `feat(cfg): render parse tree`

## Phase 2 — CFG analysis
- [x] `feat(cfg): compute FIRST sets`
- [x] `feat(cfg): compute FOLLOW sets`
- [x] `feat(cfg): detect direct left recursion`
- [x] `feat(cfg): remove direct left recursion`
- [x] `feat(cfg): detect left factoring opportunities`
- [x] `feat(cfg): apply left factoring`
- [x] `feat(cfg): add ambiguity witness search limits`

Additional completed diagnostics: nullable, undefined, unreachable, and non-generating variables.

## Phase 3 — PDA designer
- [x] `feat(pda): define PDA domain types`
- [x] `feat(pda): render state graph`
- [x] `feat(pda): add state creation and deletion`
- [x] `feat(pda): add draggable state positioning`
- [x] `feat(pda): add transition creation`
- [x] `feat(pda): add transition editor`
- [x] `feat(pda): add start and accepting-state controls`
- [x] `feat(pda): validate machine definition`

## Phase 4 — PDA execution engine
- [x] `feat(sim): add initial configuration`
- [x] `feat(sim): match consuming transitions`
- [x] `feat(sim): support epsilon transitions`
- [x] `feat(sim): apply stack pop and replacement`
- [x] `feat(sim): support final-state acceptance`
- [x] `feat(sim): support empty-stack acceptance`
- [x] `feat(sim): expand nondeterministic branches`
- [x] `feat(sim): detect dead branches`
- [x] `feat(sim): prevent epsilon-loop explosion`
- [x] `feat(sim): add execution depth and stack limits`

## Phase 5 — debugger experience
- [x] `feat(debugger): add execution trace`
- [x] `feat(debugger): add step control`
- [x] `feat(debugger): add backward time travel`
- [x] `feat(debugger): restore arbitrary configuration`
- [x] `feat(debugger): animate push and pop`
- [x] `feat(debugger): add stack timeline`
- [x] `feat(debugger): add branch status colors`
- [x] `feat(debugger): explain rejection cause`
- [x] `feat(debugger): highlight blocking transition context`

Additional completed interaction: run/pause/speed controls and keyboard shortcuts.

## Phase 6 — NPDA execution tree
- [x] `feat(tree): persist parent-child configuration graph`
- [x] `feat(tree): render execution branches`
- [x] `feat(tree): select branch node`
- [x] `feat(tree): restore branch configuration`
- [x] `feat(tree): collapse dead branches`
- [x] `feat(tree): focus accepting path`

## Phase 7 — CFG → PDA
- [x] `feat(convert): normalize CFG for conversion`
- [x] `feat(convert): construct PDA states`
- [x] `feat(convert): generate variable replacement transitions`
- [x] `feat(convert): generate terminal matching transitions`
- [x] `feat(convert): expose construction steps`
- [x] `feat(convert): run source input through generated PDA`

## Phase 8 — test bench
- [x] `feat(test): parse accept/reject assertions`
- [x] `feat(test): batch-run input strings`
- [x] `feat(test): report result and step count`
- [x] `feat(test): open failed case in debugger`

## Phase 9 — challenges
- [x] `feat(challenges): define challenge schema`
- [x] `feat(challenges): add broken-machine fixtures`
- [x] `feat(challenges): validate repairs`
- [x] `feat(challenges): add hints and scoring`

## Phase 10 — sharing and quality
- [x] `feat(storage): autosave workspace locally`
- [x] `feat(share): serialize machine and grammar`
- [x] `test: add CFG parser unit tests`
- [x] `test: add PDA transition tests`
- [x] `test: add NPDA branch tests`
- [x] `test: add acceptance-mode tests`
- [x] `test: add loop-limit regression tests`
- [x] `ci: add typecheck and build workflow`

CI now runs tests and a production build and uploads the built `dist/` artifact.

## Post-MVP backlog

These are intentionally outside the original baseline roadmap:
- Multi-character/token-aware grammar symbols (`id`, `num`, token streams) rather than character-oriented grammar notation.
- Indirect left-recursion elimination and more advanced grammar normalization.
- CYK/Earley membership for larger/less constrained CFGs.
- Web Worker offload and tree virtualization for very large NPDA searches.
- Classroom accounts, cloud workspaces, assignments, and instructor analytics.
- More challenge packs and authored lesson sequences.
- Production hosting/domain polish and browser-level visual regression tests.
