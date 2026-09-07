import type { AcceptanceMode, PDA, PDATransition } from '../core/pda/types'
import type { LanguageAssertion } from '../core/pda/testBench'
import { anbnMachine } from './sampleMachine'

export interface ChallengeDefinition {
  id: string
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
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

function cloneMachine(): PDA {
  return {
    ...anbnMachine,
    states: anbnMachine.states.map((state) => ({ ...state })),
    transitions: anbnMachine.transitions.map((transition) => ({ ...transition })),
  }
}

function patchTransition(id: string, patch: Partial<PDATransition>): PDA {
  const machine = cloneMachine()
  return {
    ...machine,
    transitions: machine.transitions.map((transition) => transition.id === id ? { ...transition, ...patch } : transition),
  }
}

const noFirstPush = patchTransition('t1', { replacement: 'Z' })

const missingSwitch: PDA = {
  ...cloneMachine(),
  transitions: anbnMachine.transitions.filter((transition) => transition.id !== 't3').map((transition) => ({ ...transition })),
}

const wrongPush = patchTransition('t2', { replacement: 'A' })
const wrongPop = patchTransition('t5', { stackTop: 'Z' })

const noFinalState: PDA = {
  ...cloneMachine(),
  states: anbnMachine.states.map((state) => state.id === 'qAccept' ? { ...state, accepting: false } : { ...state }),
}

const corruptBranch = patchTransition('t3', { replacement: 'ε' })
const wrongTerminalMatch = patchTransition('t5', { input: 'a' })

export const challenges: ChallengeDefinition[] = [
  {
    id: 'stack-never-grows',
    level: 1,
    title: 'Memory Leak — In Reverse',
    difficulty: 'Easy',
    concept: 'basic stack operation',
    briefing: 'The machine reads the first a but forgets to store it. Valid non-empty strings cannot later match their b symbols because the stack never records the first unit of memory.',
    hint: 'Inspect the transition taken on the first a while Z is on top. Its replacement must keep Z and add one count marker above it.',
    acceptanceMode: 'final-state',
    brokenMachine: noFirstPush,
    publicTests: [
      assertion('l1-p1', 'accept', 'ab'),
      assertion('l1-p2', 'accept', ''),
      assertion('l1-p3', 'reject', 'abb'),
    ],
    hiddenTests: [
      assertion('l1-h1', 'accept', 'aabb'),
      assertion('l1-h2', 'reject', 'aab'),
      assertion('l1-h3', 'accept', 'aaabbb'),
    ],
  },
  {
    id: 'missing-midpoint-switch',
    level: 2,
    title: 'The Missing Switch',
    difficulty: 'Easy',
    concept: 'missing ε-transition',
    briefing: 'This machine should recognize aⁿbⁿ, but every non-empty valid string dies while the stack is still full. Repair the transition structure without changing the language.',
    hint: 'After pushing A symbols, the machine needs a nondeterministic ε-way to enter the pop phase while A is on top.',
    acceptanceMode: 'final-state',
    brokenMachine: missingSwitch,
    publicTests: [
      assertion('l2-p1', 'accept', ''),
      assertion('l2-p2', 'accept', 'ab'),
      assertion('l2-p3', 'reject', 'aab'),
    ],
    hiddenTests: [
      assertion('l2-h1', 'accept', 'aabb'),
      assertion('l2-h2', 'accept', 'aaabbb'),
      assertion('l2-h3', 'reject', 'abb'),
    ],
  },
  {
    id: 'incorrect-stack-push',
    level: 3,
    title: 'One Marker Short',
    difficulty: 'Easy',
    concept: 'incorrect stack push',
    briefing: 'The first a is remembered correctly, but later a symbols do not grow the stack. The PDA behaves as if every positive n were n = 1.',
    hint: 'When A is already on top and another a arrives, replacement must contain the old A plus one new A.',
    acceptanceMode: 'final-state',
    brokenMachine: wrongPush,
    publicTests: [
      assertion('l3-p1', 'accept', 'ab'),
      assertion('l3-p2', 'accept', 'aabb'),
      assertion('l3-p3', 'reject', 'aab'),
    ],
    hiddenTests: [
      assertion('l3-h1', 'accept', 'aaabbb'),
      assertion('l3-h2', 'reject', 'aabbb'),
      assertion('l3-h3', 'reject', 'abab'),
    ],
  },
  {
    id: 'wrong-stack-pop',
    level: 4,
    title: 'Pop the Right Symbol',
    difficulty: 'Medium',
    concept: 'incorrect pop / stack guard',
    briefing: 'The phase switch works, but the b-loop is guarding the wrong stack symbol. Valid b input cannot discharge the memory built during the a phase.',
    hint: 'Look at what the push loop places above Z. The b-loop must require and remove that symbol once per consumed b.',
    acceptanceMode: 'final-state',
    brokenMachine: wrongPop,
    publicTests: [
      assertion('l4-p1', 'accept', 'ab'),
      assertion('l4-p2', 'accept', 'aabb'),
      assertion('l4-p3', 'reject', 'aaabb'),
    ],
    hiddenTests: [
      assertion('l4-h1', 'accept', 'aaabbb'),
      assertion('l4-h2', 'reject', 'aabbb'),
      assertion('l4-h3', 'accept', ''),
    ],
  },
  {
    id: 'lost-accept-state',
    level: 5,
    title: 'No Way Home',
    difficulty: 'Medium',
    concept: 'wrong acceptance condition',
    briefing: 'The transition logic consumes valid strings correctly, but the computation never satisfies final-state acceptance. Repair the state semantics, not the language transitions.',
    hint: 'Inspect the state reached after the bottom marker is removed. Under final-state mode, that state must be marked accepting.',
    acceptanceMode: 'final-state',
    brokenMachine: noFinalState,
    publicTests: [
      assertion('l5-p1', 'accept', ''),
      assertion('l5-p2', 'accept', 'ab'),
      assertion('l5-p3', 'reject', 'aabbba'),
    ],
    hiddenTests: [
      assertion('l5-h1', 'accept', 'aabb'),
      assertion('l5-h2', 'accept', 'aaaabbbb'),
      assertion('l5-h3', 'reject', 'ba'),
    ],
  },
  {
    id: 'corrupt-nondeterministic-branch',
    level: 6,
    title: 'The Cheating Branch',
    difficulty: 'Hard',
    concept: 'nondeterministic branch corruption',
    briefing: 'The ε-branch that guesses the midpoint silently deletes one count marker. Some unequal strings now look balanced while valid strings can die on the same branch.',
    hint: 'A phase-change ε-transition should preserve the current A. Switching control state is not supposed to consume stack memory.',
    acceptanceMode: 'final-state',
    brokenMachine: corruptBranch,
    publicTests: [
      assertion('l6-p1', 'accept', 'ab'),
      assertion('l6-p2', 'accept', 'aabb'),
      assertion('l6-p3', 'reject', 'aab'),
    ],
    hiddenTests: [
      assertion('l6-h1', 'reject', 'aaabb'),
      assertion('l6-h2', 'accept', 'aaabbb'),
      assertion('l6-h3', 'reject', 'abb'),
    ],
  },
  {
    id: 'cfg-pda-terminal-bug',
    level: 7,
    title: 'Bad Terminal Matcher',
    difficulty: 'Hard',
    concept: 'CFG → PDA conversion bug',
    briefing: 'A generated terminal-matching transition was wired to the wrong input symbol. The stack structure is correct, but the recognizer no longer corresponds to S → aSb | ε.',
    hint: 'In the pop phase, each A represents an unmatched a and must be discharged by the grammar’s closing terminal b — not by another a.',
    acceptanceMode: 'final-state',
    brokenMachine: wrongTerminalMatch,
    publicTests: [
      assertion('l7-p1', 'accept', 'ab'),
      assertion('l7-p2', 'reject', 'aaaa'),
      assertion('l7-p3', 'accept', 'aabb'),
    ],
    hiddenTests: [
      assertion('l7-h1', 'accept', 'aaabbb'),
      assertion('l7-h2', 'reject', 'aab'),
      assertion('l7-h3', 'reject', 'abab'),
    ],
  },
]
