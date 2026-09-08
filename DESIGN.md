# StackTrace Design System

## Product character

StackTrace is a computational studio for learning how grammars become machines. The interface should feel like a focused, high-signal instrument panel: expressive enough to make abstract state changes memorable, structured enough that students can always tell what is active, what changed, and what to do next.

The redesign evolves the original command-console look into a cool technical workspace:

- cool neutral canvas for orientation and long-session comfort;
- ink surfaces for the debugger's dense technical work;
- cobalt as the single action accent, with green, amber, and red reserved for semantic outcomes;
- generous type hierarchy and short explanatory labels;
- a consistent 16px surface radius and 10px control radius;
- motion reserved for state changes, playback, and attention guidance.

Design dials: variance 6/10, motion 4/10, density 8/10. The product is dense by necessity, so hierarchy comes from spacing, contrast, and typography rather than adding more cards.

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
--canvas: #f2f4f7;
--canvas-deep: #e7ebf0;
--ink: #151925;
--ink-soft: #394354;
--muted: #626d7d;
--line: #d6dbe3;
--line-strong: #bec6d1;
--surface: #fcfdff;
--surface-soft: #f5f7fa;
--accent: #3159c7;
--active: #256e88;
--success: #28765c;
--warning: #946615;
--danger: #b13d4b;
```

Color roles are semantic. Cobalt means primary action and focus, blue-teal means active computation, green means accepted, red means rejection, and amber means an inconclusive limit. Status meaning is always paired with text.

### Type

- Display: Segoe UI Variable or the platform system sans, with strong weight and compact tracking for page titles.
- Body: system sans, 14-16px, comfortable line height. Mobile form controls remain at 16px or larger.
- Machine language: platform monospace, used only for grammar, transitions, states, and numeric telemetry.
- Labels: 10-12px with modest tracking; never use tiny text for essential instructions.

### Shape and depth

- Page and feature surfaces: 16px radius.
- Controls: 10px radius.
- Pills: reserved for status, filters, and compact state labels.
- Borders are quiet and warm; depth comes from a soft shadow and a one-pixel edge, not heavy outlines.

### Layout

- Desktop: a centered 1500px workspace with 24px outer padding.
- Navigation: five primary destinations plus an Explore overflow for specialist tools. Desktop navigation stays on one line and mobile navigation reflows without horizontal scrolling.
- Workspace: three-column instrument row above a two-column debugger/telemetry row.
- Feature views: use a toolbar, a readable title, and bento panels with one obvious primary action.
- Tablet: move configuration below the editor and machine instead of forcing page-level horizontal scrolling.
- Mobile: stack content in task order; only machine and trace canvases may scroll internally rather than shrinking labels into illegibility.

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
- page-level horizontal scrolling and overloaded navigation;
- generic purple gradient branding;
- generic SaaS cards that hide the formal model;
- animation without a causal relationship to the computation.
