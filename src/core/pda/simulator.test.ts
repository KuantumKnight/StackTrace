import { describe, expect, it } from 'vitest'
import { buildExecutionTree } from './executionTree'
import { initialConfiguration, matchingTransitions, nextConfigurations } from './simulator'
import { anbnMachine } from '../../data/sampleMachine'

describe('PDA simulator', () => {
  it('creates the expected initial stack configuration', () => {
    const config = initialConfiguration(anbnMachine, 'ab')
    expect(config.state).toBe('qPush')
    expect(config.stack).toEqual(['Z'])
    expect(config.inputIndex).toBe(0)
  })

  it('pushes an A above the bottom marker while consuming a', () => {
    const initial = initialConfiguration(anbnMachine, 'ab')
    const [next] = nextConfigurations(anbnMachine, initial, 'final-state')
    expect(next.inputIndex).toBe(1)
    expect(next.stack).toEqual(['A', 'Z'])
  })

  it('exposes nondeterministic epsilon switching after a push', () => {
    const initial = initialConfiguration(anbnMachine, 'aabb')
    const afterA = nextConfigurations(anbnMachine, initial, 'final-state')[0]
    const enabled = matchingTransitions(anbnMachine, afterA)
    expect(enabled.map((transition) => transition.id)).toEqual(expect.arrayContaining(['t2', 't3']))
  })

  it('accepts valid a^n b^n strings and rejects invalid ones', () => {
    for (const input of ['', 'ab', 'aabb', 'aaabbb']) {
      const tree = buildExecutionTree(anbnMachine, input, 'final-state', 20, 500)
      expect(tree.nodes.some((node) => node.config.status === 'accepted'), input || 'epsilon').toBe(true)
    }

    for (const input of ['a', 'abb', 'aab', 'ba']) {
      const tree = buildExecutionTree(anbnMachine, input, 'final-state', 20, 500)
      expect(tree.nodes.some((node) => node.config.status === 'accepted'), input).toBe(false)
    }
  })
})
