import type { Grammar } from './grammarParser'
import type { PDA, PDATransition } from '../pda/types'

export type ConstructionStepKind = 'setup' | 'production' | 'terminal' | 'accept'

export interface CFGToPDAStep {
  id: string
  kind: ConstructionStepKind
  title: string
  rule: string
  explanation: string
  transitionIds: string[]
}

export interface CFGToPDAResult {
  machine: PDA
  steps: CFGToPDAStep[]
}

const BOTTOM = 'Z'

export function cfgToPda(grammar: Grammar): CFGToPDAResult {
  const transitions: PDATransition[] = []
  const steps: CFGToPDAStep[] = []

  const startTransition: PDATransition = {
    id: 'cfg-start',
    from: 'qInit',
    to: 'qWork',
    input: 'ε',
    stackTop: BOTTOM,
    replacement: `${grammar.startSymbol}${BOTTOM}`,
  }
  transitions.push(startTransition)
  steps.push({
    id: 'step-start',
    kind: 'setup',
    title: 'Load the start symbol',
    rule: `ε, ${BOTTOM} → ${grammar.startSymbol}${BOTTOM}`,
    explanation: `Place the grammar start symbol ${grammar.startSymbol} above the bottom-of-stack marker.`,
    transitionIds: [startTransition.id],
  })

  let productionIndex = 0
  for (const production of grammar.productions) {
    for (const alternative of production.right) {
      const transition: PDATransition = {
        id: `cfg-prod-${productionIndex}`,
        from: 'qWork',
        to: 'qWork',
        input: 'ε',
        stackTop: production.left,
        replacement: alternative === 'ε' ? 'ε' : alternative,
      }
      transitions.push(transition)
      steps.push({
        id: `step-prod-${productionIndex}`,
        kind: 'production',
        title: `Encode ${production.left} → ${alternative}`,
        rule: `ε, ${production.left} → ${alternative}`,
        explanation: alternative === 'ε'
          ? `When ${production.left} is on top of the stack, remove it without consuming input.`
          : `Nondeterministically replace ${production.left} on the stack with ${alternative}.`,
        transitionIds: [transition.id],
      })
      productionIndex += 1
    }
  }

  grammar.terminals.forEach((terminal, index) => {
    const transition: PDATransition = {
      id: `cfg-terminal-${index}`,
      from: 'qWork',
      to: 'qWork',
      input: terminal,
      stackTop: terminal,
      replacement: 'ε',
    }
    transitions.push(transition)
    steps.push({
      id: `step-terminal-${index}`,
      kind: 'terminal',
      title: `Match terminal ${terminal}`,
      rule: `${terminal}, ${terminal} → ε`,
      explanation: `Consume ${terminal} from the input exactly when ${terminal} is at the top of the stack.`,
      transitionIds: [transition.id],
    })
  })

  const acceptTransition: PDATransition = {
    id: 'cfg-accept',
    from: 'qWork',
    to: 'qAccept',
    input: 'ε',
    stackTop: BOTTOM,
    replacement: 'ε',
  }
  transitions.push(acceptTransition)
  steps.push({
    id: 'step-accept',
    kind: 'accept',
    title: 'Finish the recognition',
    rule: `ε, ${BOTTOM} → ε`,
    explanation: 'When only the bottom marker remains, remove it and enter the accepting state. Final-state acceptance still requires all input to be consumed.',
    transitionIds: [acceptTransition.id],
  })

  return {
    machine: {
      startState: 'qInit',
      initialStackSymbol: BOTTOM,
      states: [
        { id: 'qInit', name: 'qInit', initial: true, x: 100, y: 132 },
        { id: 'qWork', name: 'qWork', x: 320, y: 132 },
        { id: 'qAccept', name: 'qAccept', accepting: true, x: 550, y: 132 },
      ],
      transitions,
    },
    steps,
  }
}
