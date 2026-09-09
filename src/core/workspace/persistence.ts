import type { AcceptanceMode, PDA } from '../pda/types'

const STORAGE_KEY = 'stacktrace.workspace.v1'
const VERSION = 1
const MAX_GRAMMAR_LENGTH = 100_000
const MAX_INPUT_LENGTH = 10_000
const MAX_STATES = 256
const MAX_TRANSITIONS = 2_048
const MAX_SYMBOL_LENGTH = 128
const MAX_PAYLOAD_LENGTH = 1_000_000

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isBoundedString(value: unknown, maxLength: number, allowEmpty = true): value is string {
  return typeof value === 'string'
    && value.length <= maxLength
    && (allowEmpty || value.length > 0)
}

function isState(value: unknown): value is PDA['states'][number] {
  if (!isRecord(value)) return false
  return isBoundedString(value.id, MAX_SYMBOL_LENGTH, false)
    && isBoundedString(value.name, MAX_SYMBOL_LENGTH, false)
    && typeof value.x === 'number'
    && Number.isFinite(value.x)
    && typeof value.y === 'number'
    && Number.isFinite(value.y)
    && (value.initial === undefined || typeof value.initial === 'boolean')
    && (value.accepting === undefined || typeof value.accepting === 'boolean')
}

function isTransition(value: unknown): value is PDA['transitions'][number] {
  if (!isRecord(value)) return false
  const validNullableString = (item: unknown) => item === null || isBoundedString(item, MAX_SYMBOL_LENGTH)
  return isBoundedString(value.id, MAX_SYMBOL_LENGTH, false)
    && isBoundedString(value.from, MAX_SYMBOL_LENGTH, false)
    && isBoundedString(value.to, MAX_SYMBOL_LENGTH, false)
    && validNullableString(value.input)
    && validNullableString(value.stackTop)
    && isBoundedString(value.replacement, MAX_SYMBOL_LENGTH)
}

function isMachine(value: unknown): value is PDA {
  if (!isRecord(value)) return false
  const machine = value as Partial<PDA>
  if (!isBoundedString(machine.startState, MAX_SYMBOL_LENGTH, false)
    || !isBoundedString(machine.initialStackSymbol, MAX_SYMBOL_LENGTH)
    || !Array.isArray(machine.states)
    || !Array.isArray(machine.transitions)
    || machine.states.length === 0
    || machine.states.length > MAX_STATES
    || machine.transitions.length > MAX_TRANSITIONS
    || !machine.states.every(isState)
    || !machine.transitions.every(isTransition)) return false

  const stateIds = new Set(machine.states.map((state) => state.id))
  const transitionIds = new Set<string>()
  return stateIds.has(machine.startState)
    && stateIds.size === machine.states.length
    && machine.transitions.every((transition) => {
      if (transitionIds.has(transition.id)) return false
      transitionIds.add(transition.id)
      return stateIds.has(transition.from) && stateIds.has(transition.to)
    })
}

export function isWorkspaceSnapshot(value: unknown): value is WorkspaceSnapshot {
  if (!isRecord(value)) return false
  const snapshot = value as Partial<WorkspaceSnapshot>
  return snapshot.version === VERSION
    && isBoundedString(snapshot.grammar, MAX_GRAMMAR_LENGTH)
    && isBoundedString(snapshot.input, MAX_INPUT_LENGTH)
    && isAcceptanceMode(snapshot.acceptanceMode)
    && isMachine(snapshot.machine)
    && (snapshot.activeChallengeId === undefined || snapshot.activeChallengeId === null || isBoundedString(snapshot.activeChallengeId, MAX_SYMBOL_LENGTH, false))
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
    return isWorkspaceSnapshot(parsed) ? parsed : null
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
  const snapshot = makeSnapshot(input)
  if (!isWorkspaceSnapshot(snapshot)) {
    throw new Error('Cannot encode an invalid StackTrace workspace.')
  }
  const json = JSON.stringify(snapshot)
  return bytesToBase64Url(new TextEncoder().encode(json))
}

export function decodeWorkspace(payload: string): WorkspaceSnapshot {
  const normalized = payload.trim()
  if (!normalized || normalized.length > MAX_PAYLOAD_LENGTH) {
    throw new Error('Share payload is too large or empty.')
  }
  const json = new TextDecoder().decode(base64UrlToBytes(normalized))
  const parsed: unknown = JSON.parse(json)
  if (!isWorkspaceSnapshot(parsed)) throw new Error('Share payload is not a valid StackTrace workspace.')
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
