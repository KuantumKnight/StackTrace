import type { Configuration, PDA } from '../core/pda/types'
import { describeTransition } from '../core/pda/simulator'

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
        <div><span>EXECUTION TRACE</span><span className="heading-separator">/</span><span>TIME TRAVEL</span></div>
        <span>{history.length} configurations</span>
      </div>
      <div className="trace-columns" aria-hidden="true"><span>ID</span><span>STATE</span><span>UNREAD</span><span>STACK</span><span>OPERATION</span><span>STATUS</span></div>
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
              <i className={config.status}>{config.status}</i>
            </button>
          )
        })}
      </div>
    </section>
  )
}
