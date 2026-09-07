# Implementation Roadmap — commit-sized units

Each item below is intended to be a small Git commit.

## Phase 0 — repository foundation
- `chore: initialize Vite React TypeScript app`
- `docs: add original StackTrace project specification`
- `docs: add architecture and implementation blueprints`
- `style: add developer-tool workspace shell`

## Phase 1 — CFG editor
- `feat(cfg): add grammar parser`
- `feat(cfg): validate production syntax`
- `feat(cfg): detect terminals and non-terminals`
- `feat(cfg): add grammar diagnostics panel`
- `feat(cfg): add leftmost derivation engine`
- `feat(cfg): add rightmost derivation engine`
- `feat(cfg): add derivation stepper`
- `feat(cfg): add parse tree model`
- `feat(cfg): render parse tree`

## Phase 2 — CFG analysis
- `feat(cfg): compute FIRST sets`
- `feat(cfg): compute FOLLOW sets`
- `feat(cfg): detect direct left recursion`
- `feat(cfg): remove direct left recursion`
- `feat(cfg): detect left factoring opportunities`
- `feat(cfg): apply left factoring`
- `feat(cfg): add ambiguity witness search limits`

## Phase 3 — PDA designer
- `feat(pda): define PDA domain types`
- `feat(pda): render state graph`
- `feat(pda): add state creation and deletion`
- `feat(pda): add draggable state positioning`
- `feat(pda): add transition creation`
- `feat(pda): add transition editor`
- `feat(pda): add start and accepting-state controls`
- `feat(pda): validate machine definition`

## Phase 4 — PDA execution engine
- `feat(sim): add initial configuration`
- `feat(sim): match consuming transitions`
- `feat(sim): support epsilon transitions`
- `feat(sim): apply stack pop and replacement`
- `feat(sim): support final-state acceptance`
- `feat(sim): support empty-stack acceptance`
- `feat(sim): expand nondeterministic branches`
- `feat(sim): detect dead branches`
- `feat(sim): prevent epsilon-loop explosion`
- `feat(sim): add execution depth and stack limits`

## Phase 5 — debugger experience
- `feat(debugger): add execution trace`
- `feat(debugger): add step control`
- `feat(debugger): add backward time travel`
- `feat(debugger): restore arbitrary configuration`
- `feat(debugger): animate push and pop`
- `feat(debugger): add stack timeline`
- `feat(debugger): add branch status colors`
- `feat(debugger): explain rejection cause`
- `feat(debugger): highlight blocking transition context`

## Phase 6 — NPDA execution tree
- `feat(tree): persist parent-child configuration graph`
- `feat(tree): render execution branches`
- `feat(tree): select branch node`
- `feat(tree): restore branch configuration`
- `feat(tree): collapse dead branches`
- `feat(tree): focus accepting path`

## Phase 7 — CFG → PDA
- `feat(convert): normalize CFG for conversion`
- `feat(convert): construct PDA states`
- `feat(convert): generate variable replacement transitions`
- `feat(convert): generate terminal matching transitions`
- `feat(convert): expose construction steps`
- `feat(convert): run source input through generated PDA`

## Phase 8 — test bench
- `feat(test): parse accept/reject assertions`
- `feat(test): batch-run input strings`
- `feat(test): report result and step count`
- `feat(test): open failed case in debugger`

## Phase 9 — challenges
- `feat(challenges): define challenge schema`
- `feat(challenges): add broken-machine fixtures`
- `feat(challenges): validate repairs`
- `feat(challenges): add hints and scoring`

## Phase 10 — sharing and quality
- `feat(storage): autosave workspace locally`
- `feat(share): serialize machine and grammar`
- `test: add CFG parser unit tests`
- `test: add PDA transition tests`
- `test: add NPDA branch tests`
- `test: add acceptance-mode tests`
- `test: add loop-limit regression tests`
- `ci: add typecheck and build workflow`
