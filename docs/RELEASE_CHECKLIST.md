# StackTrace Release Checklist

Use this checklist before freezing a classroom/demo release.

## Source and dependencies

- [x] `package.json` uses exact dependency versions.
- [x] `package-lock.json` is committed.
- [x] Node.js 22 is the CI/release runtime.
- [x] CI and release workflows use `npm ci`.
- [x] Temporary dependency-generation workflows are removed.

## Formal correctness

- [x] CFG parser/analysis regression tests.
- [x] Leftmost/rightmost derivation tests.
- [x] PDA transition and stack-semantics tests.
- [x] Final-state acceptance tests.
- [x] Empty-stack acceptance tests.
- [x] NPDA nondeterministic branch tests.
- [x] ε-loop/depth/node/stack safety-limit tests.
- [x] Whole-NPDA rejection-analysis tests.
- [x] Verified `aⁿbⁿ`, balanced-parentheses, and palindrome fixtures.
- [x] Reversible Back/Forward history tests.

## Product integration

- [x] Workspace debugger.
- [x] Derivation + parse tree.
- [x] CFG analysis.
- [x] CFG → PDA conversion.
- [x] PDA Designer.
- [x] Execution Tree.
- [x] Test Bench.
- [x] Seven-level Challenges.
- [x] Example Library and named local saves.
- [x] Learn Center and PDA-vs-DFA experiment.
- [x] Share/import and autosave.
- [x] jsdom integration tests for key navigation/debugger flows.

## Accessibility and layout

- [x] Responsive layout rules.
- [x] Reduced-motion mode.
- [x] Visible keyboard focus.
- [x] Skip navigation.
- [x] Keyboard shortcuts avoid active form controls.

## Build gate

For every push/PR, StackTrace CI requires:

```bash
npm ci --no-audit --no-fund
npm test
npm run typecheck
npm run build
```

The generated `dist/` directory is uploaded as a workflow artifact.

## Deployment gate

The release workflow independently repeats the locked install, tests, typecheck, and build before publishing to `gh-pages`.

Public deployment targets:

- GitHub Pages: https://kuantumknight.github.io/StackTrace/
- Vercel: https://stacktrace-ashen.vercel.app/

After a successful static release, `StackTrace Live Smoke` retries both endpoints and requires the production page title:

```text
StackTrace — CFG & PDA Visual Debugger
```

This catches deployment/DNS/hosting regressions independently of the production build itself.

## Classroom smoke sequence

Before presenting, manually confirm this short flow:

1. Load `S -> aSb | ε`.
2. Derive `aaabbb`.
3. Open the parse tree.
4. Build CFG → PDA.
5. Step the generated PDA.
6. Inspect the execution tree.
7. Move Back then Forward.
8. Load `aabbb` and inspect the whole-NPDA rejection verdict.
9. Load Balanced Parentheses from Examples.
10. Open one Repair Lab challenge and its Designer workflow.

See `CLASSROOM_DEMO.md` for the complete presentation script.

## Release freeze rule

Once all automated checks are green, avoid unrelated feature changes immediately before a classroom demo. New algorithms or large visualization changes should start as a new post-v1.0 development cycle.
