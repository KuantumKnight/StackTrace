import { useEffect, useMemo, useState } from 'react'
import { deriveTarget, type DerivationMode } from '../core/cfg/derivation'
import { parseGrammar } from '../core/cfg/grammarParser'
import { buildParseTree } from '../core/cfg/parseTree'
import { ParseTree } from './ParseTree'

interface DerivationExplorerProps {
  grammarSource: string
  target: string
  onBack: () => void
}

function FormDisplay({ value, focusIndex }: { value: string; focusIndex?: number }) {
  if (!value) return <span className="form-symbol epsilon-symbol">ε</span>
  return <>{[...value].map((symbol, index) => <span key={`${symbol}-${index}`} className={`form-symbol ${index === focusIndex ? 'focus' : ''}`}>{symbol}</span>)}</>
}

export function DerivationExplorer({ grammarSource, target, onBack }: DerivationExplorerProps) {
  const [mode, setMode] = useState<DerivationMode>('leftmost')
  const [stepIndex, setStepIndex] = useState(0)

  const model = useMemo(() => {
    try {
      const grammar = parseGrammar(grammarSource)
      const result = deriveTarget(grammar, target, mode)
      const tree = buildParseTree(grammar.startSymbol, result.steps)
      return { grammar, result, tree, error: '' }
    } catch (error) {
      return { grammar: null, result: null, tree: null, error: error instanceof Error ? error.message : 'Invalid grammar' }
    }
  }, [grammarSource, target, mode])

  useEffect(() => setStepIndex(0), [grammarSource, target, mode])

  const maxStep = model.result?.steps.length || 0
  const currentStep = stepIndex > 0 ? model.result?.steps[stepIndex - 1] : undefined
  const currentForm = model.result?.forms[stepIndex] ?? model.grammar?.startSymbol ?? ''

  return (
    <section className="derivation-workspace">
      <div className="derivation-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div className="derivation-mode" role="group" aria-label="Derivation mode">
          <button className={mode === 'leftmost' ? 'selected' : ''} onClick={() => setMode('leftmost')}>Leftmost</button>
          <button className={mode === 'rightmost' ? 'selected' : ''} onClick={() => setMode('rightmost')}>Rightmost</button>
        </div>
        <div className="derivation-target"><small>TARGET STRING</small><strong>{target || 'ε'}</strong></div>
      </div>

      {model.error ? <div className="derivation-error">{model.error}</div> : model.result && model.tree && model.grammar && <>
        <section className="panel derivation-strip-panel">
          <div className="panel-heading"><div><span>DERIVATION TRACE</span><span className="heading-separator">/</span><span>{mode.toUpperCase()}</span></div><span>{model.result.explored} FORMS EXPLORED</span></div>
          <div className="derivation-sequence">
            {model.result.forms.map((form, index) => (
              <button key={`${form}-${index}`} className={index === stepIndex ? 'selected' : ''} onClick={() => setStepIndex(index)} disabled={index > maxStep}>
                <small>D{index}</small><span>{form || 'ε'}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="derivation-grid">
          <section className="panel derivation-step-panel">
            <div className="panel-heading"><div><span>STEP INSPECTOR</span><span className="heading-separator">/</span><span>D{stepIndex}</span></div><span>{model.result.status.toUpperCase()}</span></div>
            <div className="sentential-stage">
              <small>CURRENT SENTENTIAL FORM</small>
              <div className="sentential-form"><FormDisplay value={currentForm} /></div>
              {currentStep ? <div className="production-card">
                <span>APPLIED PRODUCTION</span>
                <strong>{currentStep.production}</strong>
                <div><FormDisplay value={currentStep.before} focusIndex={currentStep.index} /><b>⇒</b><FormDisplay value={currentStep.after} /></div>
              </div> : <div className="production-card idle"><span>START SYMBOL</span><strong>{model.grammar.startSymbol}</strong><p>Select Step or use Next to begin the derivation.</p></div>}
            </div>
            <div className="derivation-controls">
              <button disabled={stepIndex === 0} onClick={() => setStepIndex((value) => Math.max(0, value - 1))}>← Previous</button>
              <span>{stepIndex} / {maxStep}</span>
              <button className="primary-control" disabled={stepIndex >= maxStep} onClick={() => setStepIndex((value) => Math.min(maxStep, value + 1))}>Next →</button>
            </div>
            {model.result.status !== 'found' && <div className="derivation-notice">{model.result.reason}</div>}
          </section>

          <section className="panel parse-tree-panel">
            <div className="panel-heading"><div><span>PARSE TREE</span><span className="heading-separator">/</span><span>LIVE BUILD</span></div><span>STEP {stepIndex}</span></div>
            <ParseTree tree={model.tree} activeStep={stepIndex} />
            <div className="parse-tree-legend"><span><i className="active-node" />created this step</span><span><i className="future-node" />future node</span></div>
          </section>
        </div>
      </>}
    </section>
  )
}
