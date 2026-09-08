import type { Configuration, PDA, PDATransition } from '../core/pda/types'
import '../styles/rejectionContext.css'

interface RejectionContextProps {
  machine: PDA
  config: Configuration
}

function isEpsilon(value: string | null) {
  return value === null || value === '' || value === 'ε'
}

function transitionLabel(transition: PDATransition) {
  return `${transition.input || 'ε'}, ${transition.stackTop || 'ε'} → ${transition.replacement || 'ε'}`
}

function mismatchReason(transition: PDATransition, config: Configuration) {
  const nextInput = config.input[config.inputIndex]
  const stackTop = config.stack[0]
  const reasons: string[] = []

  if (!isEpsilon(transition.input) && transition.input !== nextInput) {
    reasons.push(`needs input ${transition.input}; saw ${nextInput ?? 'ε'}`)
  }
  if (!isEpsilon(transition.stackTop) && transition.stackTop !== stackTop) {
    reasons.push(`needs stack ${transition.stackTop}; top is ${stackTop ?? 'ε'}`)
  }
  return reasons.join('; ') || 'transition should be enabled'
}

export function RejectionContext({ machine, config }: RejectionContextProps) {
  const outgoing = machine.transitions.filter((transition) => transition.from === config.state)

  return (
    <div className="rejection-context">
      <div className="rejection-context-head">
        <small>Why it&apos;s blocked</small>
        <span>{outgoing.length} outgoing</span>
      </div>
      {outgoing.length ? <div className="blocked-transition-list">
        {outgoing.slice(0, 8).map((transition) => (
          <div key={transition.id}>
            <code>{transition.from} → {transition.to}</code>
            <b>{transitionLabel(transition)}</b>
            <span>{mismatchReason(transition, config)}</span>
          </div>
        ))}
      </div> : <div className="no-outgoing-transition">State {config.state} has no outgoing transitions.</div>}
    </div>
  )
}
