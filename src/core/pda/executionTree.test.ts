import { describe, expect, it } from 'vitest'
import { buildExecutionTree } from './executionTree'
import { runLanguageTests } from './testBench'
import type { PDA } from './types'
import { challenges } from '../../data/challenges'
import { anbnMachine } from '../../data/sampleMachine'

describe('NPDA execution tree safety', () => {
  it('stops a repeated epsilon configuration instead of looping forever', () => {
    const machine: PDA = {
      startState: 'q0',
      initialStackSymbol: 'Z',
      states: [{ id: 'q0', name: 'q0', initial: true, x: 100, y: 100 }],
      transitions: [{ id: 'loop', from: 'q0', to: 'q0', input: 'ε', stackTop: 'Z', replacement: 'Z' }],
    }

    const result = buildExecutionTree(machine, '', 'final-state', 20, 100)
    expect(result.nodes.length).toBe(2)
    expect(result.nodes[1].config.status).toBe('limit')
    expect(result.nodes[1].config.reason).toMatch(/Repeated configuration/)
  })

  it('the repaired reference machine satisfies every challenge suite', () => {
    for (const challenge of challenges) {
      const results = runLanguageTests(
        anbnMachine,
        [...challenge.publicTests, ...challenge.hiddenTests],
        'final-state',
        40,
        1200,
      )
      expect(results.every((result) => result.passed), challenge.id).toBe(true)
    }
  })
})
