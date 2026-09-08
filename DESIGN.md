# StackTrace Design System

## Product thesis

StackTrace is a learning debugger for context-free grammars and pushdown automata. The UI must teach the computation before it exposes the instrumentation.

The default debugger follows one visible sequence:

1. **Define** the language and input.
2. **Trace** the active state transition.
3. **Watch** stack memory change.
4. **Explain** the resulting configuration and outcome.

Deep telemetry is progressive disclosure. Trace, execution tree, and stack-depth history are alternate inspection lenses, not three permanently visible dashboards.

## Visual character

StackTrace should feel like an engineering notebook crossed with a precise debugger, not a generic SaaS dashboard.

- warm paper canvas for long reading sessions;
- near-black ink for the single high-contrast hero surface;
- cobalt for primary interaction and graph focus;
- teal for active computation;
- green, amber, and red only for semantic outcomes;
- system sans for explanation and navigation;
- monospace only for grammar, transitions, states, stack symbols, and telemetry;
- restrained 9–14 px radii;
- thin borders and very light depth instead of glassmorphism or decorative gradients.

The state graph is the visual identity. Decorative styling must never compete with it.

## Information hierarchy

### Primary navigation

- **Debug** — simulator and reversible execution history.
- **Learn** — concept-first guided labs.
- **Build** — PDA designer.
- **Practice** — repair challenges.
- **More** — derivations, grammar analysis, CFG → PDA conversion, tests, examples, execution tree, sharing.

Navigation is organized around student intent, not internal component names.

### Debugger hierarchy

The first viewport should answer, in order:

1. What concept am I looking at?
2. What is the current state of the computation?
3. What can I do next?
4. What changed in the machine and stack?
5. Where can I inspect deeper history?

The machine visualization is the hero. Configuration details support it. History inspection is below it.

## Terminology rules

Formal-language terminology must be exact because the product teaches the domain.

- Use **Valid moves** or **Enabled transitions**, not “branches,” for currently matching transitions.
- Use **Branch dead** or **Branch terminated** when one NPDA path cannot continue.
- Reserve **Rejected** for the whole search outcome when every explored path fails.
- Use **Search limit** when the simulator cannot prove rejection because an exploration guard stopped it.

Never imply that one dead nondeterministic branch means the input is rejected.

## Interaction rules

1. Current state, unread input, stack depth, and valid moves must be visible without hover.
2. Back and Forward are safe time travel; moving backward never destroys later history.
3. Motion must communicate causality: active edge, input-head movement, stack mutation, playback state.
4. Routine transitions stay below 260 ms and are interruptible.
5. `prefers-reduced-motion` removes decorative motion.
6. One region has one dominant action. Repeated shortcuts are acceptable only when they serve a distant part of a long workspace.
7. Status color always has a text label.

## Layout

### Desktop

- max workspace width: ~1600 px;
- hero explanation + live configuration summary;
- three-part stage: language setup / machine / stack memory;
- playback dock below the stage;
- one selectable deep-inspection panel below playback.

### Tablet

- language and machine remain primary;
- stack/configuration move below them;
- page-level horizontal scrolling is avoided.

### Mobile

- content stacks in task order;
- navigation becomes a compact grid;
- machine and trace canvases may scroll internally when shrinking would make formal labels unreadable;
- inspector lenses remain tabbed rather than vertically dumping every telemetry view.

## CSS architecture

`src/styles/app.css` is the legacy structural fallback for existing components.

`src/styles/studio-v2.css` is the active visual system and responsive debugger layout. It is imported last by `AppV2.tsx` and owns the theme.

Do not create another global “polish” or “theme” override file. New visual rules belong in `studio-v2.css`; feature-specific structural rules remain with their feature stylesheet.

Retired theme generations must be deleted rather than left imported in the cascade.

## Avoid

- card grids where every region has equal importance;
- walls of tiny uppercase monospace labels;
- decorative glass, glow, neon, or gradients without semantic purpose;
- global runtime status on screens where the simulator is not the active task;
- exposing every telemetry surface simultaneously;
- generic purple-gradient branding;
- inaccurate automata terminology;
- mobile layouts that simply shrink the desktop dashboard.
