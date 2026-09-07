import { useMemo } from 'react'
import { analyzeGrammar, grammarToSource, removeDirectLeftRecursion } from '../core/cfg/analysis'
import { parseGrammar } from '../core/cfg/grammarParser'
import '../styles/analysis.css'

interface CFGAnalysisProps {
  grammarSource: string
  onApplyGrammar: (source: string) => void
  onBack: () => void
}

function SetChip({ name, values }: { name: string; values: string[] }) {
  return (
    <div className="set-chip">
      <strong>{name}</strong>
      <span>{'{ '}{values.join(', ') || '∅'}{' }'}</span>
    </div>
  )
}

export function CFGAnalysis({ grammarSource, onApplyGrammar, onBack }: CFGAnalysisProps) {
  const model = useMemo(() => {
    try {
      const grammar = parseGrammar(grammarSource)
      const analysis = analyzeGrammar(grammar)
      const transformed = analysis.directLeftRecursive.length ? removeDirectLeftRecursion(grammar) : null
      return { grammar, analysis, transformed, error: '' }
    } catch (error) {
      return {
        grammar: null,
        analysis: null,
        transformed: null,
        error: error instanceof Error ? error.message : 'Invalid grammar',
      }
    }
  }, [grammarSource])

  return (
    <section className="analysis-workspace">
      <div className="analysis-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div><small>CFG STATIC ANALYSIS</small><strong>FIRST · FOLLOW · NULLABLE · LEFT RECURSION</strong></div>
      </div>

      {model.error ? <div className="analysis-error">{model.error}</div> : model.grammar && model.analysis && <>
        <div className="analysis-summary">
          <span><small>START</small><b>{model.grammar.startSymbol}</b></span>
          <span><small>VARIABLES</small><b>{model.grammar.nonTerminals.length}</b></span>
          <span><small>TERMINALS</small><b>{model.grammar.terminals.length}</b></span>
          <span><small>NULLABLE</small><b>{model.analysis.nullable.length}</b></span>
          <span><small>LEFT RECURSIVE</small><b>{model.analysis.directLeftRecursive.length}</b></span>
        </div>

        <div className="analysis-grid">
          <section className="panel analysis-panel">
            <div className="panel-heading"><span>FIRST SETS</span><span>predictive entry symbols</span></div>
            <div className="set-list">
              {model.grammar.nonTerminals.map((symbol) => <SetChip key={symbol} name={`FIRST(${symbol})`} values={model.analysis!.first[symbol] || []} />)}
            </div>
          </section>

          <section className="panel analysis-panel">
            <div className="panel-heading"><span>FOLLOW SETS</span><span>legal successors</span></div>
            <div className="set-list">
              {model.grammar.nonTerminals.map((symbol) => <SetChip key={symbol} name={`FOLLOW(${symbol})`} values={model.analysis!.follow[symbol] || []} />)}
            </div>
          </section>

          <section className="panel analysis-panel">
            <div className="panel-heading"><span>GRAMMAR HEALTH</span><span>structural diagnostics</span></div>
            <div className="health-list">
              <div><small>Nullable variables</small><strong>{model.analysis.nullable.join(', ') || 'None'}</strong></div>
              <div><small>Direct left recursion</small><strong className={model.analysis.directLeftRecursive.length ? 'warn' : 'ok'}>{model.analysis.directLeftRecursive.join(', ') || 'None detected'}</strong></div>
              <div><small>Production count</small><strong>{model.grammar.productions.reduce((sum, production) => sum + production.right.length, 0)}</strong></div>
            </div>
          </section>

          <section className="panel transform-panel">
            <div className="panel-heading"><span>LEFT-RECURSION TRANSFORM</span><span>{model.transformed ? 'AVAILABLE' : 'NOT REQUIRED'}</span></div>
            {model.transformed ? <>
              <div className="grammar-compare">
                <div><small>BEFORE</small><pre>{grammarSource}</pre></div>
                <div className="transform-arrow">→</div>
                <div><small>AFTER</small><pre>{grammarToSource(model.transformed)}</pre></div>
              </div>
              <button className="analysis-apply" onClick={() => onApplyGrammar(grammarToSource(model.transformed!))}>Apply transformed grammar</button>
            </> : <div className="analysis-clean"><span>✓</span><div><strong>No direct left recursion detected.</strong><small>The current grammar does not need this transformation.</small></div></div>}
          </section>
        </div>
      </>}
    </section>
  )
}
