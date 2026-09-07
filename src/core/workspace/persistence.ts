import type { AcceptanceMode, PDA } from '../pda/types'

const STORAGE_KEY = 'stacktrace.workspace.v1'
const VERSION = 1

export interface WorkspaceSnapshot {
  version: 1
  grammar: string
  input: string
  acceptanceMode: AcceptanceMode
  machine: PDA
  activeChallengeId?: string | null
}

export interface WorkspaceStateInput {
  grammar: string
  input: string
  acceptanceMode: AcceptanceMode
  machine: PDA
  activeChallengeId?: string | null
}

function isAcceptanceMode(value: unknown): value is AcceptanceMode {
  return value === 'final-state' || value === 'empty-stack'
}

function isMachine(value: unknown): value is PDA {
  if (!value || typeof value !== 'object') return false
  const machine = value as Partial<PDA>
  return typeof machine.startState === 'string'
    && typeof machine.initialStackSymbol === 'string'
    && Array.isArray(machine.states)
    && Array.isArray(machine.transitions)
}

function isSnapshot(value: unknown): value is WorkspaceSnapshot {
  if (!value || typeof value !== 'object') return false
  const snapshot = value as Partial<WorkspaceSnapshot>
  return snapshot.version === VERSION
    && typeof snapshot.grammar === 'string'
    && typeof snapshot.input === 'string'
    && isAcceptanceMode(snapshot.acceptanceMode)
    && isMachine(snapshot.machine)
}

export function makeSnapshot(input: WorkspaceStateInput): WorkspaceSnapshot {
  return {
    version: VERSION,
    grammar: input.grammar,
    input: input.input,
    acceptanceMode: input.acceptanceMode,
    machine: input.machine,
    activeChallengeId: input.activeChallengeId ?? null,
  }
}

export function saveWorkspace(input: WorkspaceStateInput) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(makeSnapshot(input)))
  } catch {
    // Persistence is best-effort; the debugger remains fully usable without storage.
  }
}

export function loadWorkspace(): WorkspaceSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isSnapshot(parsed) ? parsed : null
  } catch {
    return null
  }
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)
  const binary = atob(base64)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export function encodeWorkspace(input: WorkspaceStateInput) {
  const json = JSON.stringify(makeSnapshot(input))
  return bytesToBase64Url(new TextEncoder().encode(json))
}

export function decodeWorkspace(payload: string): WorkspaceSnapshot {
  const json = new TextDecoder().decode(base64UrlToBytes(payload.trim()))
  const parsed: unknown = JSON.parse(json)
  if (!isSnapshot(parsed)) throw new Error('Share payload is not a valid StackTrace workspace.')
  return parsed
}

export function shareUrl(input: WorkspaceStateInput) {
  if (typeof window === 'undefined') return encodeWorkspace(input)
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('w', encodeWorkspace(input))
  return url.toString()
}

export function readWorkspaceFromUrl(): WorkspaceSnapshot | null {
  if (typeof window === 'undefined') return null
  const payload = new URL(window.location.href).searchParams.get('w')
  if (!payload) return null
  try {
    return decodeWorkspace(payload)
  } catch {
    return null
  }
}
