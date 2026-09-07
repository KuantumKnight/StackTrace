import type { AcceptanceMode, PDA } from '../core/pda/types'
import { anbnMachine } from './sampleMachine'

export interface StackTraceExample {
  id: string
  title: string
  language: string
  grammar: string
  sampleInput: string
  acceptanceMode: AcceptanceMode
  machine: PDA
  lesson: string
  accepts: string[]
  rejects: string[]
}

export const balancedParenthesesMachine: PDA = {
  startState: 'qBalance',
  initialStackSymbol: 'Z',
  states: [
    { id: 'qBalance', name: 'qBalance', initial: true, x: 180, y: 130 },
    { id: 'qAccept', name: 'qAccept', accepting: true, x: 500, y: 130 },
  ],
  transitions: [
    { id: 'bp-push-z', from: 'qBalance', to: 'qBalance', input: '(', stackTop: 'Z', replacement: 'PZ' },
    { id: 'bp-push-p', from: 'qBalance', to: 'qBalance', input: '(', stackTop: 'P', replacement: 'PP' },
    { id: 'bp-pop', from: 'qBalance', to: 'qBalance', input: ')', stackTop: 'P', replacement: 'ε' },
    { id: 'bp-accept', from: 'qBalance', to: 'qAccept', input: 'ε', stackTop: 'Z', replacement: 'ε' },
  ],
}

export const evenPalindromeMachine: PDA = {
  startState: 'qPush',
  initialStackSymbol: 'Z',
  states: [
    { id: 'qPush', name: 'qPush', initial: true, x: 120, y: 135 },
    { id: 'qPop', name: 'qPop', x: 350, y: 135 },
    { id: 'qAccept', name: 'qAccept', accepting: true, x: 575, y: 135 },
  ],
  transitions: [
    { id: 'pal-a-z', from: 'qPush', to: 'qPush', input: 'a', stackTop: 'Z', replacement: 'AZ' },
    { id: 'pal-a-a', from: 'qPush', to: 'qPush', input: 'a', stackTop: 'A', replacement: 'AA' },
    { id: 'pal-a-b', from: 'qPush', to: 'qPush', input: 'a', stackTop: 'B', replacement: 'AB' },
    { id: 'pal-b-z', from: 'qPush', to: 'qPush', input: 'b', stackTop: 'Z', replacement: 'BZ' },
    { id: 'pal-b-a', from: 'qPush', to: 'qPush', input: 'b', stackTop: 'A', replacement: 'BA' },
    { id: 'pal-b-b', from: 'qPush', to: 'qPush', input: 'b', stackTop: 'B', replacement: 'BB' },
    { id: 'pal-mid-z', from: 'qPush', to: 'qPop', input: 'ε', stackTop: 'Z', replacement: 'Z' },
    { id: 'pal-mid-a', from: 'qPush', to: 'qPop', input: 'ε', stackTop: 'A', replacement: 'A' },
    { id: 'pal-mid-b', from: 'qPush', to: 'qPop', input: 'ε', stackTop: 'B', replacement: 'B' },
    { id: 'pal-pop-a', from: 'qPop', to: 'qPop', input: 'a', stackTop: 'A', replacement: 'ε' },
    { id: 'pal-pop-b', from: 'qPop', to: 'qPop', input: 'b', stackTop: 'B', replacement: 'ε' },
    { id: 'pal-accept', from: 'qPop', to: 'qAccept', input: 'ε', stackTop: 'Z', replacement: 'ε' },
  ],
}

export const stackTraceExamples: StackTraceExample[] = [
  {
    id: 'anbn',
    title: 'Equal a / b Count',
    language: 'L = { aⁿbⁿ | n ≥ 0 }',
    grammar: 'S -> aSb | ε',
    sampleInput: 'aaabbb',
    acceptanceMode: 'final-state',
    machine: anbnMachine,
    lesson: 'Push one A for every a, then pop one A for every b. The stack remembers an unbounded count.',
    accepts: ['', 'ab', 'aabb', 'aaabbb'],
    rejects: ['aab', 'abb', 'abab', 'ba'],
  },
  {
    id: 'balanced-parentheses',
    title: 'Balanced Parentheses',
    language: 'Dyck language with one bracket type',
    grammar: 'S -> (S)S | ε',
    sampleInput: '(()())',
    acceptanceMode: 'final-state',
    machine: balancedParenthesesMachine,
    lesson: 'Push for each opening parenthesis and pop for each closing parenthesis. Acceptance requires returning to the bottom marker exactly when input ends.',
    accepts: ['', '()', '(())', '()()', '(()())'],
    rejects: ['(', ')', '(()', '())(', '())'],
  },
  {
    id: 'even-palindrome',
    title: 'Even Palindromes',
    language: 'L = { wwᴿ | w ∈ {a,b}* }',
    grammar: 'S -> aSa | bSb | ε',
    sampleInput: 'abba',
    acceptanceMode: 'final-state',
    machine: evenPalindromeMachine,
    lesson: 'The NPDA guesses the midpoint with an ε-transition, then checks the second half by popping matching symbols.',
    accepts: ['', 'aa', 'bb', 'abba', 'baab', 'aabbaa'],
    rejects: ['a', 'ab', 'aba', 'aabb', 'abbaba'],
  },
]
