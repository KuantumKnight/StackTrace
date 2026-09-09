import { describe, expect, it } from 'vitest'
import { decodeWorkspace, encodeWorkspace } from './persistence'
import { anbnMachine } from '../../data/sampleMachine'

describe('workspace serialization', () => {
  it('round-trips grammar machine input and acceptance mode', () => {
    const snapshot = {
      grammar: 'S -> aSb | ε',
      input: 'aabb',
      acceptanceMode: 'final-state' as const,
      machine: anbnMachine,
      activeChallengeId: 'wrong-stack-pop',
    }

    const encoded = encodeWorkspace(snapshot)
    const decoded = decodeWorkspace(encoded)
    expect(decoded.version).toBe(1)
    expect(decoded.grammar).toBe(snapshot.grammar)
    expect(decoded.input).toBe(snapshot.input)
    expect(decoded.acceptanceMode).toBe(snapshot.acceptanceMode)
    expect(decoded.activeChallengeId).toBe(snapshot.activeChallengeId)
    expect(decoded.machine).toEqual(snapshot.machine)
  })

  it('rejects malformed payloads', () => {
    expect(() => decodeWorkspace('not-a-stacktrace-workspace')).toThrow()
  })

  it('rejects structurally malformed machines before they reach the app', () => {
    expect(() => encodeWorkspace({
      grammar: 'S -> a',
      input: 'a',
      acceptanceMode: 'final-state',
      machine: {
        states: [null],
        transitions: [null],
        startState: 'q0',
        initialStackSymbol: 'Z',
      },
    } as never)).toThrow(/invalid StackTrace workspace/)
  })

  it('rejects machine references to missing or duplicate states', () => {
    expect(() => encodeWorkspace({
      grammar: 'S -> a',
      input: 'a',
      acceptanceMode: 'final-state',
      machine: {
        states: [
          { id: 'q0', name: 'q0', x: 0, y: 0 },
          { id: 'q0', name: 'duplicate', x: 10, y: 10 },
        ],
        transitions: [{ id: 't0', from: 'q0', to: 'missing', input: 'a', stackTop: 'Z', replacement: 'ε' }],
        startState: 'q0',
        initialStackSymbol: 'Z',
      },
    } as never)).toThrow(/invalid StackTrace workspace/)
  })

  it('rejects oversized share payloads before decoding', () => {
    expect(() => decodeWorkspace('A'.repeat(1_000_001))).toThrow(/too large or empty/)
  })
})
