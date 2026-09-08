import { useMemo, useState } from 'react'
import { cap } from '../content'
import { cfgToPda } from '../core/cfg/cfgToPda'
import { parseGrammar } from '../core/cfg/grammarParser'
import { buildExecutionTree } from '../core/pda/executionTree'
import type { PDA } from '../core/pda/types'
import '../styles/conversion.css'
import { MachineView } from './MachineView'

interface ConversionExplorerProps {
  grammarSource: string
  target: string
  onBack: () => void
  onUseMachine: (machine: PDA) => void
}

export function ConversionExplorer({ grammarSource, target, onBack, onUseMachine }: ConversionExplorerProps) {
  const [stepIndex, setStepIndex] = useState(0)

  const model = useMemo(() => {
    try {
      const grammar = parseGrammar(grammarSource)
      const conversion = cfgToPda(grammar)
      const search = buildExecutionTree(conversion.machine, target, 'final-state', 32, 500)
      const acceptsTarget = search.nodes.some((node) => node.config.status === 'accepted')
      return { grammar, conversion, search, acceptsTarget, error: '' }
    } catch (error) {
      return {
        grammar: null,
        conversion: null,
        search: null,
        acceptsTarget: false,
        error: error instanceof Error ? error.message : 'Unable to convert grammar',
      }
    }
  }, [grammarSource, target])

  if (model.error || !model.grammar || !model.conversion || !model.search) {
    return (
      <section className="conversion-workspace">
        <div className="conversion-toolbar"><button onClick={onBack}>← Workspace</button></div>
        <div className="conversion-error">{model.error}</div>
      </section>
    )
  }

  const { machine, steps } = model.conversion
  const visibleIds = new Set(steps.slice(0, stepIndex).flatMap((step) => step.transitionIds))
  const visibleMachine: PDA = {
    ...machine,
    transitions: machine.transitions.filter((transition) => visibleIds.has(transition.id)),
  }
  const activeStep = stepIndex > 0 ? steps[stepIndex - 1] : undefined
  const activeTransitionId = activeStep?.transitionIds[0]
  const activeTransition = machine.transitions.find((transition) => transition.id === activeTransitionId)

  return (
    <section className="conversion-workspace">
      <div className="conversion-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div className="conversion-title"><strong>CFG → PDA</strong></div>
        <div className={`conversion-verdict ${model.acceptsTarget ? 'pass' : 'fail'}`}>
          <small>Target {target || 'ε'}</small>
          <strong>{model.acceptsTarget ? 'Accepts' : model.search.truncated ? 'No path in limit' : 'Rejects'}</strong>
        </div>
        <button className="use-machine-button" onClick={() => onUseMachine(machine)}>Open generated PDA</button>
      </div>

      <div className="conversion-grid">
        <aside className="panel construction-steps-panel">
          <div className="panel-heading"><div><span>Steps</span></div><span>{steps.length} rules</span></div>
          <button className={`construction-step intro ${stepIndex === 0 ? 'selected' : ''}`} onClick={() => setStepIndex(0)}>
            <span className="construction-index">00</span>
            <span><b>Source grammar</b><small>Original grammar.</small></span>
          </button>
          {steps.map((step, index) => (
            <button key={step.id} className={`construction-step ${step.kind} ${stepIndex === index + 1 ? 'selected' : ''} ${stepIndex < index + 1 ? 'future' : ''}`} onClick={() => setStepIndex(index + 1)}>
              <span className="construction-index">{String(index + 1).padStart(2, '0')}</span>
              <span><b>{step.title}</b><small>{step.rule}</small></span>
            </button>
          ))}
        </aside>

        <section className="conversion-main">
          <MachineView machine={visibleMachine} activeState={activeTransition?.from || 'qInit'} activeTransitionId={activeTransitionId} />

          <section className="panel construction-inspector">
            <div className="panel-heading"><div><span>Step {stepIndex}</span></div><span>{activeStep ? cap(activeStep.kind) : 'Source'}</span></div>
            {activeStep ? (
              <div className="construction-explanation">
                <div className="construction-rule-code"><small>Transition</small><strong>{activeStep.rule}</strong></div>
                <div><small>Why</small><p>{activeStep.explanation}</p></div>
              </div>
            ) : (
              <div className="construction-source">
                <small>Grammar</small>
                <pre>{grammarSource}</pre>
                <p>Adds a bottom marker, pushes <b>{model.grammar.startSymbol}</b>, encodes each production, then matches terminals.</p>
              </div>
            )}
            <div className="construction-controls">
              <button disabled={stepIndex === 0} onClick={() => setStepIndex((value) => Math.max(0, value - 1))}>← Previous</button>
              <span>{stepIndex} / {steps.length}</span>
              <button className="primary-control" disabled={stepIndex >= steps.length} onClick={() => setStepIndex((value) => Math.min(steps.length, value + 1))}>Next rule →</button>
            </div>
          </section>
        </section>
      </div>
    </section>
  )
}
