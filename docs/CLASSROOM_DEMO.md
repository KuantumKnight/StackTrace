# StackTrace Classroom Demo

This is the recommended short presentation flow for a Models of Computation class.

## Demo setup

Grammar:

```text
S -> aSb | ε
```

Valid input:

```text
aaabbb
```

Invalid input:

```text
aabbb
```

Acceptance mode: **Final state**.

## 90-second flow

### 1. Start with the grammar — 10 s

Open **Workspace** and point to:

```text
S -> aSb | ε
```

Explain that each recursive expansion contributes one `a` to the left and one `b` to the right, so the grammar generates `aⁿbⁿ`.

### 2. Derive the string — 10 s

Open **Derive** with `aaabbb`.

Show a leftmost derivation:

```text
S
⇒ aSb
⇒ aaSbb
⇒ aaaSbbb
⇒ aaabbb
```

Click through the derivation steps and show the parse tree.

### 3. Connect CFG to PDA — 15 s

Open **CFG → PDA**.

Advance the construction steps and point out:

- variable-replacement ε-transitions,
- terminal-matching transitions,
- bottom-stack handling,
- the generated machine verification.

Select **Open generated PDA**.

### 4. Show stack memory — 15 s

Load `aaabbb` in the debugger.

Step through the machine:

- each `a` grows the stack,
- the NPDA nondeterministically switches phase,
- each `b` removes one stored symbol,
- the input is accepted only when the chosen computation satisfies the acceptance rule.

Use the animated input head and stack panel rather than explaining the transition table only verbally.

### 5. Show nondeterminism — 10 s

Scroll to the **Execution Tree**.

Explain that an NPDA may have several possible configurations at the same logical step. A dead branch does **not** imply that the whole input is rejected if another branch can still accept.

Click a branch node to restore that exact path in the debugger.

### 6. Show time-travel debugging — 10 s

Use:

- **Back** to inspect an earlier configuration,
- **Forward** to restore the future state,
- the trace/timeline to jump directly to another stored configuration.

Stress that the debugger stores formal configurations, not animation frames.

### 7. Force a rejection — 15 s

Change the input to:

```text
aabbb
```

Run or step until the selected branch terminates.

Show both levels of explanation:

1. **branch diagnosis** — why the selected transition path stopped,
2. **whole-NPDA verdict** — whether another branch accepts, every branch rejects, or the search hit a safety limit.

This is the main educational difference between StackTrace and an ACCEPT/REJECT calculator.

### 8. Close with the learning loop — 5 s

Open **Learn** or **Challenges** and summarize the workflow:

```text
Grammar
→ derivation
→ parse tree
→ PDA construction
→ stack execution
→ branch exploration
→ debugging
→ repair and verification
```

## Optional extended demo

If more time is available:

- Open **Examples** and load Balanced Parentheses.
- Load Even Palindromes to show midpoint nondeterminism.
- Open the **PDA vs DFA** experiment in Learn.
- Open **Designer**, break a transition, and use **Tests** to identify the failing input.
- Start a **Challenge**, repair the machine, and show the public/hidden score.
- Use **Share** to copy a complete workspace URL.

## Questions you should be ready to answer

### Why is this not just an animation?

The PDA/CFG engines compute formal states first. Visualization consumes configurations and trace information. Animation does not control the mathematical result.

### How is nondeterminism handled?

The engine expands all enabled configurations within bounded depth/node/stack limits. The execution tree records the resulting parent-child configuration graph.

### Why can a dead branch coexist with acceptance?

NPDA acceptance is existential: one accepting computation is enough. A selected branch can die while another branch still accepts the same input.

### What happens if the search limit is reached?

StackTrace reports **LIMIT / inconclusive**, not rejection. It never claims rejection merely because bounded exploration stopped.

### Why can a PDA recognize `aⁿbⁿ` while a DFA cannot?

The PDA has unbounded stack memory and can remember the number of `a` symbols before matching the `b` symbols. A DFA has only finitely many states and cannot store an unbounded count. The Learn Center includes an interactive comparison for this point.
