import type { PDA } from '../core/pda/types'

export const anbnMachine: PDA = {
  startState: 'qPush',
  initialStackSymbol: 'Z',
  states: [
    { id: 'qPush', name: 'qPush', initial: true, x: 105, y: 120 },
    { id: 'qPop', name: 'qPop', x: 330, y: 120 },
    { id: 'qAccept', name: 'qAccept', accepting: true, x: 555, y: 120 },
  ],
  transitions: [
    { id: 't1', from: 'qPush', to: 'qPush', input: 'a', stackTop: 'Z', replacement: 'AZ' },
    { id: 't2', from: 'qPush', to: 'qPush', input: 'a', stackTop: 'A', replacement: 'AA' },
    { id: 't3', from: 'qPush', to: 'qPop', input: 'ε', stackTop: 'A', replacement: 'A' },
    { id: 't4', from: 'qPush', to: 'qPop', input: 'ε', stackTop: 'Z', replacement: 'Z' },
    { id: 't5', from: 'qPop', to: 'qPop', input: 'b', stackTop: 'A', replacement: 'ε' },
    { id: 't6', from: 'qPop', to: 'qAccept', input: 'ε', stackTop: 'Z', replacement: 'ε' },
  ],
}
