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
})
