import type { AcceptanceMode, PDA } from '../core/pda/types'
import type { LanguageAssertion } from '../core/pda/testBench'
import { anbnMachine } from './sampleMachine'

export interface ChallengeDefinition {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium'
  concept: string
  briefing: string
  hint: string
  acceptanceMode: AcceptanceMode
  brokenMachine: PDA
  publicTests: LanguageAssertion[]
  hiddenTests: LanguageAssertion[]
}

function assertion(id: string, expectation: 'accept' | 'reject', input: string): LanguageAssertion {
  return { id, expectation, input, sourceLine: 0 }
}

const missingSwitch: PDA = {
  ...anbnMachine,
  states: anbnMachine.states.map((state) => ({ ...state })),
  transitions: anbnMachine.transitions.filter((transition) => transition.id !== 't3').map((transition) => ({ ...transition })),
}

const wrongPop: PDA = {
  ...anbnMachine,
  states: anbnMachine.states.map((state) => ({ ...state })),
  transitions: anbnMachine.transitions.map((transition) => transition.id === 't5'
    ? { ...transition, stackTop: 'Z' }
    : { ...transition }),
}

const noFinalState: PDA = {
  ...anbnMachine,
  states: anbnMachine.states.map((state) => state.id === 'qAccept' ? { ...state, accepting: false } : { ...state }),
  transitions: anbnMachine.transitions.map((transition) => ({ ...transition })),
}

export const challenges: ChallengeDefinition[] = [
  {
    id: 'missing-midpoint-switch',
    title: 'The Missing Switch',
    difficulty: 'Easy',
    concept: 'ε-transition · NPDA phase change',
    briefing: 'This machine should recognize aⁿbⁿ, but every non-empty valid string dies while the stack is still full. Repair the transition structure without changing the language.',
    hint: 'After pushing A symbols, the machine needs a nondeterministic way to enter the pop phase before reading b.',
    acceptanceMode: 'final-state',
    brokenMachine: missingSwitch,
    publicTests: [
      assertion('p1', 'accept', ''),
      assertion('p2', 'accept', 'ab'),
      assertion('p3', 'reject', 'aab'),
    ],
    hiddenTests: [
      assertion('h1', 'accept', 'aabb'),
      assertion('h2', 'accept', 'aaabbb'),
      assertion('h3', 'reject', 'abb'),
    ],
  },
  {
    id: 'wrong-stack-pop',
    title: 'Pop the Right Symbol',
    difficulty: 'Easy',
    concept: 'stack guard · pop semantics',
    briefing: 'The phase switch works, but the pop loop is guarding the wrong stack symbol. Valid b input cannot discharge the memory built during the a phase.',
    hint: 'Look at what the push loop actually places above Z. The b-loop must remove that symbol once per consumed b.',
    acceptanceMode: 'final-state',
    brokenMachine: wrongPop,
    publicTests: [
      assertion('p1', 'accept', 'ab'),
      assertion('p2', 'accept', 'aabb'),
      assertion('p3', 'reject', 'aaabb'),
    ],
    hiddenTests: [
      assertion('h1', 'accept', 'aaabbb'),
      assertion('h2', 'reject', 'aabbb'),
      assertion('h3', 'accept', ''),
    ],
  },
  {
    id: 'lost-accept-state',
    title: 'No Way Home',
    difficulty: 'Medium',
    concept: 'final-state acceptance',
    briefing: 'The transition logic consumes valid strings correctly, but the computation never satisfies final-state acceptance. Repair the state semantics, not the language transitions.',
    hint: 'Inspect the state reached after the bottom marker is removed. Under final-state mode, that state must be marked appropriately.',
    acceptanceMode: 'final-state',
    brokenMachine: noFinalState,
    publicTests: [
      assertion('p1', 'accept', ''),
      assertion('p2', 'accept', 'ab'),
      assertion('p3', 'reject', 'aabbba'),
    ],
    hiddenTests: [
      assertion('h1', 'accept', 'aabb'),
      assertion('h2', 'accept', 'aaaabbbb'),
      assertion('h3', 'reject', 'ba'),
    ],
  },
]
