# Changelog

All notable StackTrace release changes are documented here.

## 1.1.0 — 2026-09-08

### Studio v2 frontend
- Rebuilt the debugger around a progressive learning sequence: define → trace → memory → explain
- Promoted the PDA state graph to the primary visual surface instead of treating every telemetry region equally
- Reorganized navigation around student intent: Debug, Learn, Build, Practice, and More
- Replaced the always-visible telemetry wall with selectable Trace, Execution Tree, and Stack Depth inspector lenses
- Moved input and acceptance-mode setup next to the grammar rather than burying them in a lower dashboard
- Added a compact live configuration summary with exact terminology such as Valid Moves and Branch Dead
- Made simulator status contextual to the debugger instead of global across unrelated screens
- Introduced a restrained engineering-notebook visual system with warm paper surfaces, ink, cobalt action, and teal computation states
- Reworked responsive behavior so tablet and mobile follow task order instead of shrinking the desktop dashboard
- Removed retired `signal-lab.css` and `release-polish.css` theme layers
- Preserved keyboard time travel, reduced-motion support, focus states, rejection diagnostics, and existing simulator behavior
- Updated integration tests to target the explicit playback controls in the redesigned workspace

## 1.0.0 — 2026-09-07

### CFG
- Live grammar parsing and diagnostics
- Leftmost/rightmost derivation search
- Parse-tree reconstruction
- FIRST/FOLLOW and nullable analysis
- Left-recursion detection/removal
- Left factoring
- Bounded ambiguity-witness search

### CFG → PDA
- Progressive construction visualization
- Variable and terminal transition generation
- Bounded verification of the generated PDA
- Direct handoff into the debugger

### PDA / NPDA
- Interactive PDA designer
- Animated machine, input tape, and stack
- Final-state and empty-stack acceptance
- Bounded nondeterministic execution tree
- ε-loop, node, depth, and stack-growth protections
- Branch restoration and accepting-path focus
- Whole-NPDA acceptance/rejection/limit analysis

### Debugger
- Step/run/pause/reset controls
- True Back/Forward time travel
- Execution trace and stack timeline
- Branch-specific rejection diagnostics
- Blocking-transition explanations
- Keyboard controls

### Learning
- Learn Center
- PDA vs DFA memory experiment
- Verified `aⁿbⁿ`, balanced-parentheses, and even-palindrome examples
- Named local workspace saves

### Practice
- Batch language Test Bench
- Seven-level PDA Repair Lab
- Public/hidden tests, hints, acceptance conventions, and 100-point scoring

### Sharing and quality
- Versioned autosave
- Share/import URLs and payloads
- Responsive/reduced-motion/accessibility polish
- Formal and browser-style integration regression tests
- Exact dependency versions and committed lockfile
- Deterministic `npm ci` CI/release builds
- GitHub Pages and Vercel deployment support
