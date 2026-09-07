import { useMemo } from 'react'
import type { CSSProperties } from 'react'

interface StackViewProps {
  stack: string[]
  previousStack?: string[]
}

function stackDelta(previous: string[], current: string[]) {
  if (!previous.length && !current.length) return { kind: 'idle', label: 'No stack mutation' }
  if (current.length > previous.length) return { kind: 'push', label: `PUSH +${current.length - previous.length}` }
  if (current.length < previous.length) return { kind: 'pop', label: `POP −${previous.length - current.length}` }
  if (current.join('') !== previous.join('')) return { kind: 'replace', label: 'REPLACE TOP' }
  return { kind: 'idle', label: 'Stack unchanged' }
}

export function StackView({ stack, previousStack = [] }: StackViewProps) {
  const delta = useMemo(() => stackDelta(previousStack, stack), [previousStack, stack])
  const maxDepth = Math.max(stack.length, 1)

  return (
    <section className="panel stack-panel">
      <div className="panel-heading">
        <div><span>STACK MEMORY</span><span className="heading-separator">/</span><span>LIFO</span></div>
        <span>{stack.length} symbols</span>
      </div>

      <div className="stack-telemetry">
        <span className={`stack-operation ${delta.kind}`}>{delta.label}</span>
        <span className="stack-depth">depth <b>{stack.length}</b></span>
      </div>

      <div className="stack-chamber">
        <div className="stack-rail left" />
        <div className="stack-view" style={{ '--stack-depth': maxDepth } as CSSProperties}>
          {stack.length ? stack.map((symbol, index) => (
            <div
              className={`stack-cell ${index === 0 ? 'top' : ''}`}
              key={`${symbol}-${stack.length}-${index}`}
              style={{ '--stack-index': index } as CSSProperties}
            >
              <span>{symbol}</span>
              <small>{index === 0 ? 'TOP' : `#${index}`}</small>
            </div>
          )) : <div className="empty-stack"><b>ε</b><span>empty stack</span></div>}
        </div>
        <div className="stack-rail right" />
        <div className="stack-base">STACK BASE</div>
      </div>
    </section>
  )
}
