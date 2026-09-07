import type { AcceptanceMode, Configuration, PDA, PDATransition } from './types'

const epsilon = (value: string | null) => value === null || value === '' || value === 'ε'

export function isAccepted(machine: PDA, config: Configuration, mode: AcceptanceMode) {
  const inputConsumed = config.inputIndex >= config.input.length
  if (!inputConsumed) return false
  if (mode === 'empty-stack') return config.stack.length === 0
  return machine.states.some((state) => state.id === config.state && state.accepting)
}

export function matchingTransitions(machine: PDA, config: Configuration) {
  const next = config.input[config.inputIndex]
  const top = config.stack[0]

  return machine.transitions.filter((transition) => {
    const inputMatches = epsilon(transition.input) || transition.input === next
    const stackMatches = epsilon(transition.stackTop) || transition.stackTop === top
    return transition.from === config.state && inputMatches && stackMatches
  })
}

export function initialConfiguration(machine: PDA, input: string, mode: AcceptanceMode = 'final-state'): Configuration {
  const config: Configuration = {
    id: 'c0',
    state: machine.startState,
    input,
    inputIndex: 0,
    stack: machine.initialStackSymbol ? [machine.initialStackSymbol] : [],
    parentId: null,
    transitionId: null,
    depth: 0,
    status: 'active',
  }

  if (isAccepted(machine, config, mode)) config.status = 'accepted'
  return config
}

export function nextConfigurations(
  machine: PDA,
  config: Configuration,
  mode: AcceptanceMode,
  idSeed = 0,
): Configuration[] {
  if (isAccepted(machine, config, mode)) {
    return [{ ...config, id: `c${idSeed + 1}`, parentId: config.id, depth: config.depth + 1, status: 'accepted' }]
  }

  const matches = matchingTransitions(machine, config)
  if (!matches.length) {
    return [{
      ...config,
      id: `c${idSeed + 1}`,
      parentId: config.id,
      depth: config.depth + 1,
      status: 'dead',
      reason: `No transition exists for state ${config.state}, input ${config.input[config.inputIndex] ?? 'ε'}, and stack top ${config.stack[0] ?? 'ε'}.`,
    }]
  }

  return matches.map((transition, index) => {
    const stack = [...config.stack]
    if (!epsilon(transition.stackTop)) stack.shift()
    const replacement = epsilon(transition.replacement) ? [] : [...transition.replacement]

    const next: Configuration = {
      id: `c${idSeed + index + 1}`,
      state: transition.to,
      input: config.input,
      inputIndex: config.inputIndex + (epsilon(transition.input) ? 0 : 1),
      stack: [...replacement, ...stack],
      parentId: config.id,
      transitionId: transition.id,
      depth: config.depth + 1,
      status: 'active',
    }

    if (isAccepted(machine, next, mode)) next.status = 'accepted'
    return next
  })
}

export function describeTransition(transition: PDATransition | undefined) {
  if (!transition) return 'Initial configuration'
  const read = epsilon(transition.input) ? 'ε' : transition.input
  const pop = epsilon(transition.stackTop) ? 'nothing' : transition.stackTop
  const push = epsilon(transition.replacement) ? 'nothing' : transition.replacement
  return `Read ${read} · pop ${pop} · push ${push}`
}
