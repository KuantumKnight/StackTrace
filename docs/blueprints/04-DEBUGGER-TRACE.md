# Debugger & Trace Blueprint

## Principle
Every visible simulation screen must derive from a stored configuration. This gives exact backward/forward navigation.

## Trace event
- sequence number
- before configuration
- transition used
- after configuration
- human-readable operation explanation

## Explanation generation
Example:
`Read b; pop A; push nothing; move q0 → q1.`

## Time travel
History is not only a linear array for NPDA. Store a configuration graph. The UI keeps `selectedConfigurationId`. Back moves to parent; clicking a node jumps to that configuration.

## Rejection diagnostics
Rank dead branches by closeness:
1. more input consumed
2. lower remaining stack mismatch
3. deeper valid path

Show:
- closest branch
- state
- unread input
- stack
- missing transition tuple
- last successful transition

## Run loop
Animation scheduler belongs in UI. The engine only calculates the next configurations.
