import type { Configuration, PDA } from '../core/pda/types'
import { describeTransition } from '../core/pda/simulator'
import { cap } from '../content'

interface ExecutionTraceProps {
  machine: PDA
  history: Configuration[]
  activeIndex: number
  onSelect: (index: number) => void
}

export function ExecutionTrace({ machine, history, activeIndex, onSelect }: ExecutionTraceProps) {
  return (
    <section className="panel trace-panel">
      <div className="panel-heading">
        <span>Trace history</span>
        <span>{history.length} steps</span>
      </div>
      <div className="trace-columns" aria-hidden="true"><span>ID</span><span>State</span><span>Unread</span><span>Stack</span><span>Operation</span><span>Status</span></div>
      <div className="trace-list">
        {history.map((config, index) => {
          const transition = machine.transitions.find((item) => item.id === config.transitionId)
          return (
            <button key={config.id} className={index === activeIndex ? 'selected' : ''} onClick={() => onSelect(index)}>
              <b>C{index}</b>
              <span className="trace-state">{config.state}</span>
              <span className="trace-mono">{config.input.slice(config.inputIndex) || 'ε'}</span>
              <span className="trace-mono">{config.stack.join('') || 'ε'}</span>
              <span className="trace-operation">{describeTransition(transition)}</span>
              <i className={config.status}>{cap(config.status)}</i>
            </button>
          )
        })}
      </div>
    </section>
  )
}
