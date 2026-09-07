import { describe, expect, it } from 'vitest'
import { anbnMachine } from '../../data/sampleMachine'
import { analyzePDAOutcome } from './rejectionAnalysis'
import type { PDA } from './types'

describe('whole-NPDA outcome analysis', () => {
  it('reports acceptance when any computation branch accepts', () => {
    const result = analyzePDAOutcome(anbnMachine, 'aabb', 'final-state')
    expect(result.verdict).toBe('accepted')
    expect(result.acceptingDepth).toBeTypeOf('number')
  })

  it('reports rejection only after a complete search terminates', () => {
    const result = analyzePDAOutcome(anbnMachine, 'aabbb', 'final-state')
    expect(result.verdict).toBe('rejected')
    expect(result.deadBranches).toBeGreaterThan(0)
    expect(result.closest?.inputIndex).toBeGreaterThan(0)
    expect(result.closestPath.length).toBeGreaterThan(0)
  })

  it('reports limit rather than rejection for an unbounded epsilon growth', () => {
    const machine: PDA = {
      startState: 'q0',
      initialStackSymbol: 'Z',
      states: [{ id: 'q0', name: 'q0', initial: true, x: 100, y: 100 }],
      transitions: [
        { id: 'grow-z', from: 'q0', to: 'q0', input: 'ε', stackTop: 'Z', replacement: 'AZ' },
        { id: 'grow-a', from: 'q0', to: 'q0', input: 'ε', stackTop: 'A', replacement: 'AA' },
      ],
    }
    const result = analyzePDAOutcome(machine, '', 'final-state', 50, 500, 4)
    expect(result.verdict).toBe('limit')
    expect(result.limitedBranches).toBeGreaterThan(0)
  })
})
