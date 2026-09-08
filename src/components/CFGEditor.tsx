import { useMemo } from 'react'
import { parseGrammar } from '../core/cfg/grammarParser'

interface CFGEditorProps {
  value: string
  onChange: (next: string) => void
  onBuild?: () => void
}

export function CFGEditor({ value, onChange, onBuild }: CFGEditorProps) {
  const result = useMemo(() => {
    try { return { grammar: parseGrammar(value), error: '' } }
    catch (error) { return { grammar: null, error: error instanceof Error ? error.message : 'Invalid grammar' } }
  }, [value])

  return (
    <section className="panel cfg-panel">
      <div className="panel-heading"><label htmlFor="grammar-source">GRAMMAR</label><span>CFG EDITOR</span></div>
      <textarea id="grammar-source" value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} />
      <div className="grammar-meta">
        {result.error ? <span className="danger">{result.error}</span> : <>
          <span>Start: {result.grammar?.startSymbol}</span>
          <span>Variables: {result.grammar?.nonTerminals.join(', ')}</span>
          <span>Terminals: {result.grammar?.terminals.join(', ') || 'None'}</span>
        </>}
      </div>
      {onBuild && (
        <div className="grammar-build-row">
          <span>Grammar text and the current PDA are separate until you build.</span>
          <button className="grammar-build-button" type="button" disabled={Boolean(result.error)} onClick={onBuild}>Build PDA from CFG →</button>
        </div>
      )}
    </section>
  )
}
