import { useMemo, useState } from 'react'
import { buildExecutionTree } from '../core/pda/executionTree'
import '../styles/learn.css'
import { anbnMachine } from '../data/sampleMachine'

interface PdaVsDfaLabProps {
  onOpenDebugger: (input: string) => void
}

export function PdaVsDfaLab({ onOpenDebugger }: PdaVsDfaLabProps) {
  const [n, setN] = useState(3)
  const [finiteMemory, setFiniteMemory] = useState(2)
  const input = `${'a'.repeat(n)}${'b'.repeat(n)}`
  const tree = useMemo(() => buildExecutionTree(anbnMachine, input, 'final-state', 40, 1200), [input])
  const accepting = tree.nodes.find((node) => node.config.status === 'accepted')
  const stackHeights = useMemo(() => {
    const heights: number[] = [0]
    for (let i = 1; i <= n; i += 1) heights.push(i)
    for (let i = n - 1; i >= 0; i -= 1) heights.push(i)
    return heights
  }, [n])
  const overflow = n > finiteMemory

  return (
    <section className="panel dfa-pda-lab">
      <div className="panel-heading"><div><span>PDA VS DFA</span><span className="heading-separator">/</span><span>aⁿbⁿ</span></div><span>INTERACTIVE MEMORY EXPERIMENT</span></div>
      <div className="lab-controls">
        <label><span>n</span><input type="range" min="0" max="8" value={n} onChange={(event) => setN(Number(event.target.value))} /><b>{n}</b></label>
        <label><span>toy DFA counter capacity</span><input type="range" min="1" max="6" value={finiteMemory} onChange={(event) => setFiniteMemory(Number(event.target.value))} /><b>{finiteMemory}</b></label>
        <code>{input || 'ε'}</code>
      </div>

      <div className="memory-compare-grid">
        <article className={`memory-card finite-memory ${overflow ? 'overflow' : ''}`}>
          <header><small>FINITE AUTOMATON</small><strong>Finite control only</strong></header>
          <div className="finite-meter" aria-label={`Toy finite-memory capacity ${finiteMemory}`}>
            {Array.from({ length: finiteMemory }, (_, index) => <span className={index < Math.min(n, finiteMemory) ? 'filled' : ''} key={index}>{index + 1}</span>)}
          </div>
          <p>{overflow
            ? `At n = ${n}, this bounded ${finiteMemory}-slot memory model has already lost the exact count. Adding more finite states only moves the failure farther out; it never handles arbitrary n.`
            : `This toy finite controller can remember this small n, but only because n is within its fixed ${finiteMemory}-slot bound.`}</p>
          <div className="memory-verdict"><span>{overflow ? 'BOUND EXCEEDED' : 'WITHIN TOY BOUND'}</span><small>This is an intuition demo, not the formal proof.</small></div>
        </article>

        <article className="memory-card stack-memory">
          <header><small>PUSHDOWN AUTOMATON</small><strong>Unbounded stack memory</strong></header>
          <div className="stack-height-strip" aria-label="PDA stack height over the input">
            {stackHeights.map((height, index) => <span key={`${height}-${index}`} style={{ height: `${12 + height * 14}px` }} title={`height ${height}`} />)}
          </div>
          <p>The PDA pushes one marker for each <code>a</code>, then pops one for each <code>b</code>. The same rule works for every n; the input determines how much stack is used.</p>
          <div className="memory-verdict accepted"><span>{accepting ? 'ACCEPTED' : tree.truncated ? 'SEARCH LIMIT' : 'REJECTED'}</span><small>{accepting ? `Actual StackTrace PDA reaches acceptance at depth ${accepting.depth}.` : 'No accepting computation was found.'}</small></div>
        </article>
      </div>

      <div className="formal-note">
        <strong>Why a DFA cannot recognize aⁿbⁿ</strong>
        <span>A DFA has finitely many states. For sufficiently many prefixes aⁱ, two different counts must reach the same state. Appending the same number of b symbols would then force the DFA to treat two different counts identically, contradicting the required equality. The PDA avoids that collision by storing one stack marker per a.</span>
        <button onClick={() => onOpenDebugger(input)}>Open this input in debugger →</button>
      </div>
    </section>
  )
}
