# Visualization Blueprint

## PDA state graph
Use React Flow for production implementation because node dragging, edge selection, zoom/pan, and custom nodes are core requirements.

Custom state node:
- state name
- initial marker
- accepting double-ring
- current-state glow
- breakpoint/error marker later

Custom transition edge:
- compact formal label
- selected/active styling
- grouped parallel transitions where possible

## Execution tree
Each node shows compact tuple `(q, unread, stack)` with status badge. Expand details on selection rather than putting all data on canvas.

## Stack
Use a vertical container with top at top. Animate previous/next diff instead of continuously animating all cells.

## Derivation/parse tree
Keep grammar parse tree separate from NPDA execution tree; they teach different concepts and should not share visual semantics.
