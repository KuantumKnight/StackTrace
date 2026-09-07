# UI/UX Blueprint

## Goal
StackTrace should behave visually like a debugger/IDE, not a marketing-style educational site.

## Desktop workspace
Top bar:
- Product name.
- Main modes: Workspace, Derivations, Execution Tree, Test Bench, Challenges.
- Global run status.

Primary 3-column area:
1. Left: CFG/machine source and object explorer.
2. Center: graph or tree canvas.
3. Right: current configuration and stack.

Bottom area:
- Debug input and run controls.
- Execution trace / timeline.

## Interaction model
- Selecting a trace row restores that configuration.
- Clicking a state selects it and opens state properties.
- Clicking an edge opens transition properties.
- Clicking an execution-tree node time-travels to that branch.
- Step executes one transition/branch expansion.
- Run advances until accept/dead/limit or user pause.

## Responsive policy
Primary target is laptop/desktop classroom use. Below 900px switch to tabbed panels rather than compressing the graph.

## Visual language
- Dark neutral background.
- Thin borders and dense information hierarchy.
- Monospace for formal expressions and configurations.
- One semantic accent for active selection.
- Green = accepted, red = dead/rejected, amber = execution limit/warning.
- Animation only for state transition, stack mutation, branch creation, and derivation replacement.

## Accessibility
- Never rely on color alone for branch status.
- Keyboard shortcuts: Space step, Shift+Space run/pause, Alt+Left back, R reset.
- SVG nodes must have labels and focus states.
