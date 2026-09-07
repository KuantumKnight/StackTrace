import { useMemo } from 'react'
import { parseGrammar } from '../core/cfg/grammarParser'

export function CFGEditor({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const result = useMemo(() => {
    try { return { grammar: parseGrammar(value), error: '' } }
    catch (error) { return { grammar: null, error: error instanceof Error ? error.message : 'Invalid grammar' } }
  }, [value])

  return (
    <section className="panel cfg-panel">
      <div className="panel-heading"><span>GRAMMAR</span><span>CFG EDITOR</span></div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} />
      <div className="grammar-meta">
        {result.error ? <span className="danger">{result.error}</span> : <>
          <span>Start: {result.grammar?.startSymbol}</span>
          <span>Variables: {result.grammar?.nonTerminals.join(', ')}</span>
          <span>Terminals: {result.grammar?.terminals.join(', ') || '—'}</span>
        </>}
      </div>
    </section>
  )
}
