import { useMemo, useState } from 'react'
import { acceptanceName, cap, outcomeLabel } from '../content'
import { parseAssertions, runLanguageTests } from '../core/pda/testBench'
import type { AcceptanceMode, PDA } from '../core/pda/types'
import '../styles/testBench.css'

interface TestBenchProps {
  machine: PDA
  mode: AcceptanceMode
  onBack: () => void
  onDebugInput: (input: string) => void
}

const defaultAssertions = `accept ""
accept "ab"
accept "aabb"
accept "aaabbb"
reject "aabbb"
reject "abb"
reject "abab"`

export function TestBench({ machine, mode, onBack, onDebugInput }: TestBenchProps) {
  const [source, setSource] = useState(defaultAssertions)
  const parsed = useMemo(() => parseAssertions(source), [source])
  const results = useMemo(() => runLanguageTests(machine, parsed.assertions, mode), [machine, parsed.assertions, mode])
  const passed = results.filter((result) => result.passed).length
  const limited = results.filter((result) => result.outcome === 'limit').length

  return (
    <section className="testbench-workspace">
      <div className="testbench-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div className="testbench-title"><strong>Test bench</strong></div>
        <div className={`testbench-summary ${passed === results.length && !parsed.errors.length ? 'pass' : 'mixed'}`}>
          <strong>{passed} / {results.length}</strong><small>passing</small>
        </div>
      </div>

      <div className="testbench-grid">
        <section className="panel assertion-editor-panel">
          <div className="panel-heading"><div><span>Assertions</span></div><span>{acceptanceName(mode)}</span></div>
          <textarea value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} aria-label="Language test assertions" />
          <div className="assertion-help">
            <code>accept "aabb"</code><code>reject "abab"</code><span>Use <b>""</b> or <b>"ε"</b> for the empty string.</span>
          </div>
          {parsed.errors.length > 0 && <div className="assertion-errors">{parsed.errors.map((error) => <span key={error}>{error}</span>)}</div>}
        </section>

        <section className="panel test-results-panel">
          <div className="panel-heading"><div><span>Results</span></div><span>{limited ? `${limited} limited` : 'Complete'}</span></div>
          <div className="test-results-head" aria-hidden="true"><span>Test</span><span>Input</span><span>Expected</span><span>Actual</span><span>Steps</span><span>Action</span></div>
          <div className="test-results-list">
            {results.map((result, index) => (
              <article key={result.id} className={`test-result ${result.passed ? 'pass' : result.outcome === 'limit' ? 'limit' : 'fail'}`}>
                <span className="test-number">T{String(index + 1).padStart(2, '0')}</span>
                <code>{result.input || 'ε'}</code>
                <span>{cap(result.expectation)}</span>
                <span className={`outcome ${result.outcome}`}>{outcomeLabel(result.outcome)}</span>
                <span>{result.configurations}</span>
                <button onClick={() => onDebugInput(result.input)}>{result.passed ? 'Inspect' : 'Debug'}</button>
                <p>{result.reason}</p>
              </article>
            ))}
            {!results.length && <div className="empty-tests">Add an assertion on the left to run the machine.</div>}
          </div>
        </section>
      </div>
    </section>
  )
}
