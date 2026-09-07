import { describe, expect, it } from 'vitest'
import { initialConfiguration } from '../pda/simulator'
import { anbnMachine } from '../../data/sampleMachine'
import {
  appendHistoryEntry,
  canMoveForward,
  createDebuggerHistory,
  moveHistoryBack,
  moveHistoryForward,
  replaceHistoryPath,
  selectHistoryEntry,
} from './history'

function config(id: string, depth: number) {
  return {
    ...initialConfiguration(anbnMachine, 'ab', 'final-state'),
    id,
    depth,
    inputIndex: Math.min(depth, 2),
    stack: depth ? ['A', 'Z'] : ['Z'],
  }
}

describe('reversible debugger history', () => {
  it('moves backward without destroying the future', () => {
    let history = createDebuggerHistory(config('c0', 0))
    history = appendHistoryEntry(history, config('c1', 1))
    history = appendHistoryEntry(history, config('c2', 2))
    history = moveHistoryBack(history)

    expect(history.cursor).toBe(1)
    expect(history.entries).toHaveLength(3)
    expect(canMoveForward(history)).toBe(true)

    history = moveHistoryForward(history)
    expect(history.cursor).toBe(2)
    expect(history.entries[2].id).toBe('c2')
  })

  it('forks history only when a new step is taken from the past', () => {
    let history = createDebuggerHistory(config('c0', 0))
    history = appendHistoryEntry(history, config('c1', 1))
    history = appendHistoryEntry(history, config('c2-old', 2))
    history = selectHistoryEntry(history, 1)
    history = appendHistoryEntry(history, config('c2-new', 2))

    expect(history.entries.map((entry) => entry.id)).toEqual(['c0', 'c1', 'c2-new'])
    expect(history.cursor).toBe(2)
  })

  it('loads a selected NPDA branch as an exact reversible path', () => {
    const history = replaceHistoryPath([config('n0', 0), config('n1', 1), config('n2', 2)])
    expect(history.cursor).toBe(2)
    expect(moveHistoryBack(history).entries).toHaveLength(3)
  })
})
