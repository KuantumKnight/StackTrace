import type { Configuration } from '../pda/types'

export interface DebuggerHistory {
  entries: Configuration[]
  cursor: number
}

function cloneConfiguration(config: Configuration): Configuration {
  return { ...config, stack: [...config.stack] }
}

export function createDebuggerHistory(initial: Configuration): DebuggerHistory {
  return { entries: [cloneConfiguration(initial)], cursor: 0 }
}

export function historyCurrent(history: DebuggerHistory) {
  return history.entries[history.cursor]
}

export function canMoveBack(history: DebuggerHistory) {
  return history.cursor > 0
}

export function canMoveForward(history: DebuggerHistory) {
  return history.cursor < history.entries.length - 1
}

export function moveHistoryBack(history: DebuggerHistory): DebuggerHistory {
  if (!canMoveBack(history)) return history
  return { ...history, cursor: history.cursor - 1 }
}

export function moveHistoryForward(history: DebuggerHistory): DebuggerHistory {
  if (!canMoveForward(history)) return history
  return { ...history, cursor: history.cursor + 1 }
}

export function selectHistoryEntry(history: DebuggerHistory, index: number): DebuggerHistory {
  if (!Number.isInteger(index) || index < 0 || index >= history.entries.length) return history
  return { ...history, cursor: index }
}

export function appendHistoryEntry(history: DebuggerHistory, config: Configuration): DebuggerHistory {
  const prefix = history.entries.slice(0, history.cursor + 1)
  const entries = [...prefix, cloneConfiguration(config)]
  return { entries, cursor: entries.length - 1 }
}

export function replaceHistoryPath(path: Configuration[]): DebuggerHistory {
  if (!path.length) throw new Error('Debugger history path cannot be empty.')
  const entries = path.map(cloneConfiguration)
  return { entries, cursor: entries.length - 1 }
}
