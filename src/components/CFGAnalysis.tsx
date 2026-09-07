import { useMemo } from 'react'
import { analyzeGrammar, grammarToSource, removeDirectLeftRecursion } from '../core/cfg/analysis'
import { findAmbiguityWitness } from '../core/cfg/ambiguity'
import { grammarDiagnostics } from '../core/cfg/diagnostics'
import { findLeftFactoringOpportunities, leftFactorGrammar } from '../core/cfg/factoring'
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
      const diagnostics = grammarDiagnostics(grammar)
      const factoring = findLeftFactoringOpportunities(grammar)
      const leftRecursionFree = analysis.directLeftRecursive.length ? removeDirectLeftRecursion(grammar) : null
      const factored = factoring.length ? leftFactorGrammar(grammar) : null
      const ambiguity = findAmbiguityWitness(grammar, 8, 14, 4000)
      return { grammar, analysis, diagnostics, factoring, leftRecursionFree, factored, ambiguity, error: '' }
    } catch (error) {
      return {
        grammar: null,
        analysis: null,
        diagnostics: [],
        factoring: [],
        leftRecursionFree: null,
        factored: null,
        ambiguity: null,
        error: error instanceof Error ? error.message : 'Invalid grammar',
      }
    }
  }, [grammarSource])

  return (
    <section className="analysis-workspace">
      <div className="analysis-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div><small>CFG STATIC ANALYSIS</small><strong>FIRST · FOLLOW · DIAGNOSTICS · TRANSFORMS · AMBIGUITY SEARCH</strong></div>
      </div>

      {model.error ? <div className="analysis-error">{model.error}</div> : model.grammar && model.analysis && model.ambiguity && <>
        <div className="analysis-summary">
          <span><small>START</small><b>{model.grammar.startSymbol}</b></span>
          <span><small>VARIABLES</small><b>{model.grammar.nonTerminals.length}</b></span>
          <span><small>TERMINALS</small><b>{model.grammar.terminals.length}</b></span>
          <span><small>NULLABLE</small><b>{model.analysis.nullable.length}</b></span>
          <span><small>ISSUES</small><b>{model.diagnostics.length + model.analysis.directLeftRecursive.length + model.factoring.length}</b></span>
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
            <div className="panel-heading"><span>GRAMMAR HEALTH</span><span>{model.diagnostics.length ? `${model.diagnostics.length} DIAGNOSTICS` : 'CLEAN'}</span></div>
            <div className="health-list">
              <div><small>Nullable variables</small><strong>{model.analysis.nullable.join(', ') || 'None'}</strong></div>
              <div><small>Direct left recursion</small><strong className={model.analysis.directLeftRecursive.length ? 'warn' : 'ok'}>{model.analysis.directLeftRecursive.join(', ') || 'None detected'}</strong></div>
              <div><small>Left-factor opportunities</small><strong className={model.factoring.length ? 'warn' : 'ok'}>{model.factoring.length || 'None detected'}</strong></div>
              <div><small>Production count</small><strong>{model.grammar.productions.reduce((sum, production) => sum + production.right.length, 0)}</strong></div>
            </div>
            <div className="diagnostic-list">
              {model.diagnostics.map((item) => <div className={item.level} key={`${item.code}-${item.symbol}`}><b>{item.symbol}</b><span>{item.message}</span></div>)}
              {!model.diagnostics.length && <div className="ok"><b>✓</b><span>No undefined, unreachable, or non-generating variables detected.</span></div>}
            </div>
          </section>

          <section className="panel analysis-panel ambiguity-panel">
            <div className="panel-heading"><span>AMBIGUITY WITNESS</span><span>BOUNDED LEFTMOST SEARCH</span></div>
            {model.ambiguity.witness ? <div className="ambiguity-witness">
              <div><small>WITNESS STRING</small><strong>{model.ambiguity.witness.value}</strong></div>
              <div className="ambiguity-paths">
                <ol>{model.ambiguity.witness.derivationA.map((form, index) => <li key={`a-${index}`}>{form}</li>)}</ol>
                <span>≠</span>
                <ol>{model.ambiguity.witness.derivationB.map((form, index) => <li key={`b-${index}`}>{form}</li>)}</ol>
              </div>
              <p>Two distinct leftmost derivations reach the same terminal string, which is an ambiguity witness.</p>
            </div> : <div className="ambiguity-clear">
              <strong>No witness found within the search bounds.</strong>
              <span>{model.ambiguity.explored} derivation states explored{model.ambiguity.truncated ? ' before the node limit.' : '.'}</span>
              <small>This is not a proof that the grammar is unambiguous.</small>
            </div>}
          </section>

          <section className="panel transform-panel">
            <div className="panel-heading"><span>LEFT-RECURSION TRANSFORM</span><span>{model.leftRecursionFree ? 'AVAILABLE' : 'NOT REQUIRED'}</span></div>
            {model.leftRecursionFree ? <>
              <div className="grammar-compare">
                <div><small>BEFORE</small><pre>{grammarSource}</pre></div>
                <div className="transform-arrow">→</div>
                <div><small>AFTER</small><pre>{grammarToSource(model.leftRecursionFree)}</pre></div>
              </div>
              <button className="analysis-apply" onClick={() => onApplyGrammar(grammarToSource(model.leftRecursionFree!))}>Apply recursion-free grammar</button>
            </> : <div className="analysis-clean"><span>✓</span><div><strong>No direct left recursion detected.</strong><small>The current grammar does not need this transformation.</small></div></div>}
          </section>

          <section className="panel transform-panel">
            <div className="panel-heading"><span>LEFT FACTORING</span><span>{model.factored ? `${model.factoring.length} OPPORTUNITY` : 'NOT REQUIRED'}</span></div>
            {model.factored ? <>
              <div className="factoring-opportunities">
                {model.factoring.map((item) => <code key={`${item.left}-${item.prefix}`}>{item.left}: prefix “{item.prefix}” groups {item.alternatives.join(' | ')}</code>)}
              </div>
              <div className="grammar-compare">
                <div><small>BEFORE</small><pre>{grammarSource}</pre></div>
                <div className="transform-arrow">→</div>
                <div><small>AFTER</small><pre>{grammarToSource(model.factored)}</pre></div>
              </div>
              <button className="analysis-apply" onClick={() => onApplyGrammar(grammarToSource(model.factored!))}>Apply left-factored grammar</button>
            </> : <div className="analysis-clean"><span>✓</span><div><strong>No common-prefix conflict detected.</strong><small>The current alternatives do not require left factoring.</small></div></div>}
          </section>
        </div>
      </>}
    </section>
  )
}
