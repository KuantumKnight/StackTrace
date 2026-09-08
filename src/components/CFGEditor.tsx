import { useMemo } from 'react'
import { cfgToPda } from '../core/cfg/cfgToPda'
import { parseGrammar } from '../core/cfg/grammarParser'
import { loadWorkspace, saveWorkspace } from '../core/workspace/persistence'

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

  const buildPda = () => {
    if (onBuild) {
      onBuild()
      return
    }
    if (!result.grammar) return

    const current = loadWorkspace()
    const testInput = document.querySelector<HTMLInputElement>('.test-string-field input')?.value ?? current?.input ?? ''
    const machine = cfgToPda(result.grammar).machine

    saveWorkspace({
      grammar: value,
      input: testInput,
      acceptanceMode: 'final-state',
      machine,
      activeChallengeId: null,
    })

    const url = new URL(window.location.href)
    url.searchParams.delete('w')
    window.location.replace(url.toString())
  }

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
      <div className="grammar-build-row">
        <span>Edits change the CFG text first. Build to regenerate the PDA used by Step/Run.</span>
        <button className="grammar-build-button" type="button" disabled={Boolean(result.error)} onClick={buildPda}>Build PDA from CFG →</button>
      </div>
    </section>
  )
}
