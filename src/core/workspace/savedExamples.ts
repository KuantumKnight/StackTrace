import { makeSnapshot, type WorkspaceSnapshot, type WorkspaceStateInput } from './persistence'

const STORAGE_KEY = 'stacktrace.saved-examples.v1'
const MAX_SAVED = 24

export interface SavedWorkspace {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  snapshot: WorkspaceSnapshot
}

function isSavedWorkspace(value: unknown): value is SavedWorkspace {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<SavedWorkspace>
  return typeof item.id === 'string'
    && typeof item.name === 'string'
    && typeof item.createdAt === 'string'
    && typeof item.updatedAt === 'string'
    && !!item.snapshot
    && item.snapshot.version === 1
    && typeof item.snapshot.grammar === 'string'
    && typeof item.snapshot.input === 'string'
    && !!item.snapshot.machine
}

function write(items: SavedWorkspace[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_SAVED)))
  } catch {
    // Named saves are optional; the main workspace still functions without storage.
  }
}

export function loadSavedWorkspaces(): SavedWorkspace[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isSavedWorkspace).slice(0, MAX_SAVED)
  } catch {
    return []
  }
}

export function saveNamedWorkspace(name: string, workspace: WorkspaceStateInput): SavedWorkspace[] {
  const cleanName = name.trim().replace(/\s+/g, ' ').slice(0, 48)
  if (!cleanName) throw new Error('Give this workspace a name before saving it.')

  const now = new Date().toISOString()
  const current = loadSavedWorkspaces()
  const existing = current.find((item) => item.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase())
  const saved: SavedWorkspace = existing
    ? { ...existing, name: cleanName, updatedAt: now, snapshot: makeSnapshot(workspace) }
    : {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `save-${Date.now()}`,
        name: cleanName,
        createdAt: now,
        updatedAt: now,
        snapshot: makeSnapshot(workspace),
      }

  const next = [saved, ...current.filter((item) => item.id !== saved.id)].slice(0, MAX_SAVED)
  write(next)
  return next
}

export function deleteSavedWorkspace(id: string): SavedWorkspace[] {
  const next = loadSavedWorkspaces().filter((item) => item.id !== id)
  write(next)
  return next
}
