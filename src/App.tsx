import { useEffect, useMemo, useState } from 'react'
import { CFGEditor } from './components/CFGEditor'
import { ExecutionTrace } from './components/ExecutionTrace'
import { ExecutionTree } from './components/ExecutionTree'
import { InputTape } from './components/InputTape'
import { MachineView } from './components/MachineView'
import { StackTimeline } from './components/StackTimeline'
import { StackView } from './components/StackView'
import { describeTransition, initialConfiguration, matchingTransitions, nextConfigurations } from './core/pda/simulator'
import type { AcceptanceMode, Configuration } from './core/pda/types'
import { anbnMachine } from './data/sampleMachine'
import './styles/app.css'

const defaultGrammar = 'S -> aSb | ε'

const speedOptions = [
  { label: '0.5×', ms: 1250 },
  { label: '1×', ms: 720 },
  { label: '1.5×', ms: 440 },
  { label: '2×', ms: 260 },
]

export default function App() {
  const [grammar, setGrammar] = useState(defaultGrammar)
  const [input, setInput] = useState('aaabbb')
  const [acceptanceMode, setAcceptanceMode] = useState<AcceptanceMode>('final-state')
  const [history, setHistory] = useState<Configuration[]>(() => [initialConfiguration(anbnMachine, 'aaabbb')])
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(720)

  const activeIndex = history.length - 1
  const current = history[activeIndex]
  const previous = history[Math.max(0, activeIndex - 1)]
  const unread = current.input.slice(current.inputIndex) || 'ε'
  const transition = useMemo(
    () => anbnMachine.transitions.find((item) => item.id === current.transitionId),
    [current.transitionId],
  )
  const availableTransitions = useMemo(() => matchingTransitions(anbnMachine, current), [current])

  const reset = (nextInput = input, mode = acceptanceMode) => {
    setRunning(false)
    setHistory([initialConfiguration(anbnMachine, nextInput, mode)])
  }

  const step = () => {
    if (current.status !== 'active') {
      setRunning(false)
      return
    }
    const next = nextConfigurations(anbnMachine, current, acceptanceMode, history.length - 1)
    setHistory((prev) => [...prev, next[0]])
  }

  useEffect(() => {
    if (!running) return
    if (current.status !== 'active') {
      setRunning(false)
      return
    }
    const timer = window.setTimeout(step, speed)
    return () => window.clearTimeout(timer)
  }, [running, speed, current.id])

  const selectHistory = (index: number) => {
    setRunning(false)
    setHistory((prev) => prev.slice(0, index + 1))
  }

  const updateMode = (mode: AcceptanceMode) => {
    setAcceptanceMode(mode)
    reset(input, mode)
  }

  const resultText = current.status === 'accepted'
    ? 'Input accepted by the current PDA.'
    : current.status === 'dead'
      ? current.reason || 'This computation branch terminated.'
      : `${availableTransitions.length} transition${availableTransitions.length === 1 ? '' : 's'} currently enabled.`

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true"><span /></div>
          <div><strong>StackTrace</strong><span>CFG + PDA visual debugger</span></div>
        </div>
        <nav aria-label="Workspace views">
          <button className="active-tab">Workspace</button>
          <button disabled title="Derivation explorer is the next implementation phase">Derivations <small>SOON</small></button>
          <button onClick={() => document.getElementById('execution-tree')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Execution Tree</button>
          <button disabled title="Challenge mode is planned after the core debugger">Challenges <small>SOON</small></button>
        </nav>
        <div className={`status-badge ${current.status}`}><span className="status-light" />{current.status.toUpperCase()}</div>
      </header>

      <section className="run-strip" aria-live="polite">
        <div className="run-state"><span className={`pulse ${running ? 'running' : ''}`} /><b>{running ? 'RUNNING' : 'DEBUG READY'}</b><span>{resultText}</span></div>
        <div className="run-metrics">
          <span><small>STEP</small><b>{activeIndex}</b></span>
          <span><small>STATE</small><b>{current.state}</b></span>
          <span><small>UNREAD</small><b>{unread}</b></span>
          <span><small>STACK</small><b>{current.stack.length}</b></span>
          <span><small>BRANCHES</small><b>{availableTransitions.length}</b></span>
        </div>
      </section>

      <div className="workspace-grid">
        <CFGEditor value={grammar} onChange={setGrammar} />
        <MachineView machine={anbnMachine} activeState={current.state} activeTransitionId={current.transitionId} />
        <aside className="configuration-column">
          <section className="panel config-panel">
            <div className="panel-heading"><div><span>CONFIGURATION</span><span className="heading-separator">/</span><span>C{activeIndex}</span></div><span>{acceptanceMode === 'final-state' ? 'FINAL STATE' : 'EMPTY STACK'}</span></div>
            <div className="config-primary">
              <div><small>CURRENT STATE</small><strong>{current.state}</strong></div>
              <div><small>INPUT HEAD</small><strong>{current.input[current.inputIndex] ?? 'ε'}</strong></div>
            </div>
            <dl>
              <dt>Unread input</dt><dd>{unread}</dd>
              <dt>Stack top</dt><dd>{current.stack[0] ?? 'ε'}</dd>
              <dt>Depth</dt><dd>{current.depth}</dd>
              <dt>Transition</dt><dd>{transition ? `${transition.input || 'ε'}, ${transition.stackTop || 'ε'} → ${transition.replacement || 'ε'}` : 'initial'}</dd>
            </dl>
            <div className="operation-explain"><small>SEMANTICS</small><span>{describeTransition(transition)}</span></div>
          </section>
          <StackView stack={current.stack} previousStack={previous.stack} />
        </aside>
      </div>

      <section className="bottom-grid">
        <section className="panel debugger-panel">
          <div className="panel-heading"><div><span>DEBUG INPUT</span><span className="heading-separator">/</span><span>PLAYBACK</span></div><span>TIME-TRAVEL ENABLED</span></div>
          <InputTape input={current.input} inputIndex={current.inputIndex} />

          <div className="debug-input-row">
            <label><span>TEST STRING</span><input value={input} onChange={(event) => setInput(event.target.value.replace(/\s/g, ''))} onKeyDown={(event) => event.key === 'Enter' && reset(input)} spellCheck={false} /></label>
            <button className="load-button" onClick={() => reset(input)}>Load input</button>
          </div>

          <div className="playback-row">
            <div className="controls">
              <button disabled={history.length <= 1} onClick={() => selectHistory(activeIndex - 1)} title="Previous configuration">← Back</button>
              <button className="primary-control" onClick={step} disabled={current.status !== 'active'}>Step →</button>
              <button className={running ? 'pause-control' : ''} onClick={() => setRunning((value) => !value)} disabled={current.status !== 'active'}>{running ? 'Pause' : '▶ Run'}</button>
              <button onClick={() => reset(input)}>↻ Reset</button>
            </div>
            <label className="speed-control">Speed<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>{speedOptions.map((option) => <option key={option.ms} value={option.ms}>{option.label}</option>)}</select></label>
          </div>

          <div className="acceptance-control" role="group" aria-label="PDA acceptance mode">
            <span>ACCEPT BY</span>
            <button className={acceptanceMode === 'final-state' ? 'selected' : ''} onClick={() => updateMode('final-state')}>Final state</button>
            <button className={acceptanceMode === 'empty-stack' ? 'selected' : ''} onClick={() => updateMode('empty-stack')}>Empty stack</button>
          </div>

          {current.status === 'dead' && <div className="rejection"><div className="rejection-icon">×</div><div><strong>BRANCH TERMINATED</strong><span>{current.reason}</span><small>Inspect C{Math.max(0, activeIndex - 1)} to see the last valid configuration.</small></div></div>}
          {current.status === 'accepted' && <div className="acceptance"><div className="acceptance-icon">✓</div><div><strong>STRING ACCEPTED</strong><span>The selected acceptance condition is satisfied with all input consumed.</span></div></div>}
        </section>

        <section className="telemetry-column">
          <StackTimeline history={history} activeIndex={activeIndex} onSelect={selectHistory} />
          <ExecutionTree machine={anbnMachine} input={current.input} mode={acceptanceMode} />
          <ExecutionTrace machine={anbnMachine} history={history} activeIndex={activeIndex} onSelect={selectHistory} />
        </section>
      </section>
    </main>
  )
}
