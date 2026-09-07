# Implementation Roadmap — completion status

The original commit-sized MVP roadmap and the identified release-critical post-MVP gaps are complete on `main`.

## Phase 0 — repository foundation
- [x] Vite + React + TypeScript application
- [x] Original StackTrace project specification
- [x] Architecture and implementation blueprints
- [x] Dense developer-tool workspace shell

## Phase 1 — CFG editor and derivations
- [x] Grammar parser and syntax validation
- [x] Terminal/non-terminal detection
- [x] Grammar diagnostics
- [x] Leftmost derivation engine
- [x] Rightmost derivation engine
- [x] Derivation stepper
- [x] Parse-tree model and rendering

## Phase 2 — CFG analysis
- [x] FIRST sets
- [x] FOLLOW sets
- [x] Nullable-variable analysis
- [x] Undefined-variable diagnostics
- [x] Unreachable-variable diagnostics
- [x] Non-generating-variable diagnostics
- [x] Direct left-recursion detection/removal
- [x] Left-factoring detection/transformation
- [x] Bounded ambiguity-witness search with explicit non-proof semantics

## Phase 3 — PDA designer
- [x] PDA domain types
- [x] State graph rendering
- [x] State creation/deletion
- [x] Draggable state positioning
- [x] Transition creation/edit/delete
- [x] Start/final-state controls
- [x] Machine validation diagnostics

## Phase 4 — PDA / NPDA execution engine
- [x] Initial configuration
- [x] Consuming transitions
- [x] ε-transitions
- [x] Stack pop/replacement semantics
- [x] Final-state acceptance
- [x] Empty-stack acceptance
- [x] Nondeterministic branch expansion
- [x] Dead-branch detection
- [x] ε-loop protection
- [x] Depth/node/stack safety limits
- [x] Whole-NPDA acceptance/rejection/limit verdicts

## Phase 5 — debugger experience
- [x] Execution trace
- [x] Step control
- [x] True Back/Forward time travel
- [x] Restore arbitrary stored configuration
- [x] Restore execution-tree branch path
- [x] Animated push/pop/replace
- [x] Stack-height timeline
- [x] Branch status colors
- [x] Branch-level rejection explanation
- [x] Blocking-transition context
- [x] Run/pause/speed controls
- [x] Keyboard shortcuts

## Phase 6 — NPDA execution tree
- [x] Parent-child configuration graph
- [x] Branch rendering
- [x] Branch-node selection
- [x] Exact branch restoration
- [x] Hide dead branches
- [x] Focus shortest accepting path
- [x] Correct `LIMIT` semantics when bounded exploration is incomplete

## Phase 7 — CFG → PDA
- [x] CFG normalization for construction
- [x] PDA-state construction
- [x] Variable-replacement ε-transitions
- [x] Terminal-matching transitions
- [x] Progressive construction steps
- [x] Bounded source/generated-machine verification
- [x] Open generated machine directly in debugger

## Phase 8 — language test bench
- [x] Parse `accept` / `reject` assertions
- [x] Batch-run inputs
- [x] Report outcome and explored configuration count
- [x] Jump failed cases into debugger

## Phase 9 — challenge mode
- [x] Challenge schema
- [x] Broken-machine fixtures
- [x] Repair validation
- [x] Public/hidden tests
- [x] Acceptance convention per challenge
- [x] Hints and 100-point scoring
- [x] Seven-level repair progression

## Phase 10 — learning, examples, persistence, and sharing
- [x] Learn Center
- [x] PDA vs DFA / `aⁿbⁿ` memory experiment
- [x] Verified `aⁿbⁿ` example
- [x] Verified balanced-parentheses example
- [x] Verified even-palindrome NPDA example
- [x] Named local workspace saves
- [x] Versioned workspace autosave
- [x] Share/import payloads and URLs
- [x] Recompute execution history instead of serializing trace state

## Phase 11 — quality and release
- [x] CFG unit/regression tests
- [x] PDA transition/acceptance tests
- [x] NPDA branch and safety-limit tests
- [x] Canonical example language tests
- [x] Rejection-analysis tests
- [x] Reversible-history tests
- [x] jsdom app integration tests
- [x] Responsive layouts
- [x] Reduced-motion handling
- [x] Keyboard focus styling and skip navigation
- [x] Exact dependency versions
- [x] Committed `package-lock.json`
- [x] Deterministic `npm ci` CI/release installs
- [x] Typecheck + production build gate
- [x] GitHub Pages deployment
- [x] Vercel deployment
- [x] Classroom demo documentation

## Optional future directions

These are extensions, not unfinished v1.0 work:

- Multi-character/token-aware grammar symbols (`id`, `num`, token streams) instead of character-oriented notation.
- Indirect left-recursion elimination and more advanced grammar normalization.
- CYK/Earley membership for larger or less constrained CFGs.
- Web Worker offload and tree virtualization for very large NPDA searches.
- Classroom accounts, cloud workspaces, assignments, and instructor analytics.
- Additional authored challenge packs beyond the seven-level core progression.
- Automated screenshot-based visual regression across multiple browsers.
- Custom domain and analytics if the project becomes a public long-term service.
