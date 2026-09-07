export type AcceptanceMode = 'final-state' | 'empty-stack'
export type BranchStatus = 'active' | 'accepted' | 'dead' | 'limit'

export interface PDAState {
  id: string
  name: string
  initial?: boolean
  accepting?: boolean
  x: number
  y: number
}

export interface PDATransition {
  id: string
  from: string
  to: string
  input: string | null
  stackTop: string | null
  replacement: string
}

export interface PDA {
  states: PDAState[]
  transitions: PDATransition[]
  startState: string
  initialStackSymbol: string
}

export interface Configuration {
  id: string
  state: string
  input: string
  inputIndex: number
  stack: string[]
  parentId: string | null
  transitionId: string | null
  depth: number
  status: BranchStatus
  reason?: string
}

export interface TraceEvent {
  step: number
  before: Configuration
  transition: PDATransition | null
  after: Configuration
  explanation: string
}
