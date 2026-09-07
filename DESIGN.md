# StackTrace Design System

## Product character

StackTrace is a computational studio for learning how grammars become machines. The interface should feel like a calm, high-signal lab: expressive enough to make abstract state changes memorable, structured enough that students can always tell what is active, what changed, and what to do next.

The redesign replaces the neon command-console look with a warm editorial workspace:

- paper canvas for orientation and breathing room;
- ink surfaces for the debugger's dense technical work;
- violet, cyan, coral, and mint as semantic accents rather than decoration;
- generous type hierarchy and short explanatory labels;
- rounded containers with a few sharper “instrument” surfaces for contrast;
- motion reserved for state changes, playback, and attention guidance.

## Design references

These references informed the system, without copying any product's visual identity:

- [Material 3 Expressive](https://m3.material.io/) — expressive color, flexible typography, adaptive components, and intentional motion.
- [Material 3 levels of expression](https://developer.android.com/design/ui/wear/guides/get-started/levels-expression) — use expressive treatments for hero moments while keeping the foundation predictable.
- [Vercel Geist](https://vercel.com/geist/stack) — high-contrast developer tooling, disciplined grids, and a purposeful sans/mono pairing.
- [GitHub Primer](https://primer.github.io/design/) — tokenized foundations, reusable patterns, and accessibility as a system property.
- [Apple Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) — motion should communicate status and feedback, stay brief, and respect reduced-motion preferences.
- [DESIGN.md](https://getdesign.md/blog/web-design-md/) — keep the visual rules in a durable, AI-readable source of truth.

## Visual tokens

### Color

```css
--canvas: #f5f2eb;
--canvas-deep: #ebe6dc;
--ink: #17162a;
--ink-soft: #3f3c55;
--muted: #77738a;
--line: #ded9cf;
--line-strong: #c7c1b6;
--surface: #fffdf8;
--surface-soft: #f8f6f0;
--violet: #5e4bd6;
--cyan: #1aa7a1;
--coral: #e76f51;
--mint: #3a9d7c;
--amber: #c4872f;
--danger: #c94d5c;
```

Color roles are semantic. Violet means primary action and focus, cyan means active computation, mint means accepted, coral means attention or rejection, and amber means an inconclusive limit.

### Type

- Display: system sans with a strong weight and compact tracking for page titles.
- Body: system sans, 14–16px, comfortable line height.
- Machine language: platform monospace, used only for grammar, transitions, states, and numeric telemetry.
- Labels: 10–11px uppercase with modest tracking; never use tiny text for essential instructions.

### Shape and depth

- Page and feature surfaces: 18px radius.
- Controls: 10–12px radius.
- Pills: reserved for status, filters, and compact state labels.
- Borders are quiet and warm; depth comes from a soft shadow and a one-pixel edge, not heavy outlines.

### Layout

- Desktop: a centered 1500px workspace with 24px outer padding.
- Navigation: one clear top-level row; active view is a filled pill.
- Workspace: three-column instrument row above a two-column debugger/telemetry row.
- Feature views: use a toolbar, a readable title, and bento panels with one obvious primary action.
- Mobile: stack content in task order; keep horizontal machine/timeline canvases scrollable rather than shrinking labels into illegibility.

## Interaction rules

1. Make the current computational state visible without requiring a hover.
2. Pair every status color with a text label or icon; never rely on color alone.
3. Use motion to show causality: input head movement, stack changes, active graph transitions, and playback state.
4. Keep transitions under 260ms for routine feedback and interruptible.
5. Honor `prefers-reduced-motion` by removing decorative motion while preserving state changes through color, labels, and layout.
6. Preserve the product's strongest interaction: Back and Forward must feel like safe, reversible time travel.

## Component language

- `.panel` is the shared elevated surface.
- `.panel-heading` is a compact section header, not a second title system.
- `.primary-control` is the single dominant action in a region.
- `.status-badge`, `.outcome`, and `.stack-operation` carry semantic state.
- Graph, stack, tape, timeline, and execution tree use the same semantic palette so the user can transfer meaning between views.

## Avoid

- neon-on-black everywhere;
- all-caps copy as the main reading voice;
- decorative gradients that compete with the graph or stack;
- large walls of tiny monospace text;
- generic SaaS cards that hide the formal model;
- animation without a causal relationship to the computation.
