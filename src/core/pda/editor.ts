import type { PDA, PDAState, PDATransition } from './types'

export interface PDADiagnostic {
  level: 'error' | 'warning'
  message: string
}

export function nextStateName(machine: PDA) {
  let index = machine.states.length
  while (machine.states.some((state) => state.id === `q${index}`)) index += 1
  return `q${index}`
}

export function createState(machine: PDA, x = 320, y = 160): PDAState {
  const id = nextStateName(machine)
  return { id, name: id, x, y }
}

export function createTransition(machine: PDA, from?: string, to?: string): PDATransition {
  const index = machine.transitions.reduce((max, transition) => {
    const match = transition.id.match(/editor-t(\d+)/)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0) + 1

  const fallback = machine.states[0]?.id || ''
  return {
    id: `editor-t${index}`,
    from: from || fallback,
    to: to || from || fallback,
    input: 'ε',
    stackTop: 'ε',
    replacement: 'ε',
  }
}

export function validatePDA(machine: PDA): PDADiagnostic[] {
  const diagnostics: PDADiagnostic[] = []
  const ids = new Set<string>()

  if (!machine.states.length) diagnostics.push({ level: 'error', message: 'The machine needs at least one state.' })
  for (const state of machine.states) {
    if (!state.id.trim()) diagnostics.push({ level: 'error', message: 'Every state needs a non-empty ID.' })
    if (ids.has(state.id)) diagnostics.push({ level: 'error', message: `Duplicate state ID: ${state.id}.` })
    ids.add(state.id)
  }

  if (!ids.has(machine.startState)) diagnostics.push({ level: 'error', message: 'The start state does not exist.' })
  if (!machine.states.some((state) => state.accepting)) diagnostics.push({ level: 'warning', message: 'No accepting state is currently marked.' })

  for (const transition of machine.transitions) {
    if (!ids.has(transition.from) || !ids.has(transition.to)) {
      diagnostics.push({ level: 'error', message: `Transition ${transition.id} references a missing state.` })
    }
  }

  return diagnostics
}
