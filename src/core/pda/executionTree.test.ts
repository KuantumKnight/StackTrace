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

  it('accepts by empty stack independently of final-state markings', () => {
    const machine: PDA = {
      startState: 'q0',
      initialStackSymbol: 'Z',
      states: [{ id: 'q0', name: 'q0', initial: true, accepting: false, x: 100, y: 100 }],
      transitions: [{ id: 'consume', from: 'q0', to: 'q0', input: 'a', stackTop: 'Z', replacement: 'ε' }],
    }

    const emptyStackTree = buildExecutionTree(machine, 'a', 'empty-stack', 10, 50)
    const finalStateTree = buildExecutionTree(machine, 'a', 'final-state', 10, 50)
    expect(emptyStackTree.nodes.some((node) => node.config.status === 'accepted')).toBe(true)
    expect(finalStateTree.nodes.some((node) => node.config.status === 'accepted')).toBe(false)
  })

  it('halts branches that exceed the configured stack depth', () => {
    const machine: PDA = {
      startState: 'q0',
      initialStackSymbol: 'Z',
      states: [{ id: 'q0', name: 'q0', initial: true, x: 100, y: 100 }],
      transitions: [
        { id: 'grow-z', from: 'q0', to: 'q0', input: 'ε', stackTop: 'Z', replacement: 'AZ' },
        { id: 'grow-a', from: 'q0', to: 'q0', input: 'ε', stackTop: 'A', replacement: 'AA' },
      ],
    }

    const result = buildExecutionTree(machine, '', 'final-state', 20, 100, 3)
    const limited = result.nodes.find((node) => node.config.reason?.includes('Stack depth limit'))
    expect(result.truncated).toBe(true)
    expect(limited?.config.status).toBe('limit')
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
