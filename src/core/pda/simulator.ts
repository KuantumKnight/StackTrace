import type { AcceptanceMode, Configuration, PDA, PDATransition } from './types'

const epsilon = (value: string | null) => value === null || value === '' || value === 'ε'

function configurationKey(config: Configuration) {
  return `${config.state}|${config.inputIndex}|${config.stack.join('\u0001')}`
}

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

function hasAcceptingContinuation(
  machine: PDA,
  start: Configuration,
  mode: AcceptanceMode,
  maxDepth: number,
  maxNodes: number,
) {
  if (isAccepted(machine, start, mode) || start.status === 'accepted') return true
  if (start.status !== 'active') return false

  const queue: Array<{ config: Configuration; depth: number }> = [{ config: start, depth: 0 }]
  const visited = new Set([configurationKey(start)])
  let explored = 0

  while (queue.length && explored < maxNodes) {
    const { config, depth } = queue.shift()!
    explored += 1
    if (depth >= maxDepth) continue

    const children = nextConfigurations(machine, config, mode, explored)
    for (const child of children) {
      if (child.status === 'accepted' || isAccepted(machine, child, mode)) return true
      if (child.status !== 'active' || child.stack.length > 96) continue

      const key = configurationKey(child)
      if (visited.has(key)) continue
      visited.add(key)
      queue.push({ config: child, depth: depth + 1 })
    }
  }

  return false
}

/**
 * Pick a useful branch for single-path playback without changing NPDA semantics.
 * When several transitions are enabled, bounded look-ahead prefers a child that
 * can still reach acceptance. The execution tree remains the source of truth for
 * all branches; this function only chooses which witness the linear Step/Run UI follows.
 */
export function preferredNextConfiguration(
  machine: PDA,
  config: Configuration,
  mode: AcceptanceMode,
  idSeed = 0,
): Configuration {
  const next = nextConfigurations(machine, config, mode, idSeed)
  if (next.length <= 1) return next[0]

  const accepted = next.find((candidate) => candidate.status === 'accepted' || isAccepted(machine, candidate, mode))
  if (accepted) return accepted

  const maxDepth = Math.max(48, Math.min(96, config.input.length * 5 + 20))
  for (const candidate of next) {
    if (candidate.status === 'active' && hasAcceptingContinuation(machine, candidate, mode, maxDepth, 2400)) {
      return candidate
    }
  }

  const immediatelyViable = next.find((candidate) => candidate.status === 'active' && matchingTransitions(machine, candidate).length > 0)
  return immediatelyViable ?? next[0]
}

export function describeTransition(transition: PDATransition | undefined) {
  if (!transition) return 'Initial configuration'
  const read = epsilon(transition.input) ? 'ε' : transition.input
  const pop = epsilon(transition.stackTop) ? 'nothing' : transition.stackTop
  const push = epsilon(transition.replacement) ? 'nothing' : transition.replacement
  return `Read ${read} · pop ${pop} · push ${push}`
}
