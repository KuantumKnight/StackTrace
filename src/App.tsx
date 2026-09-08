import { useEffect, useMemo, useRef, useState } from 'react'
import { CFGAnalysis } from './components/CFGAnalysis'
import { CFGEditor } from './components/CFGEditor'
import { ChallengeMode } from './components/ChallengeMode'
import { ConversionExplorer } from './components/ConversionExplorer'
import { DerivationExplorer } from './components/DerivationExplorer'
import { ExampleLibrary } from './components/ExampleLibrary'
import { ExecutionTrace } from './components/ExecutionTrace'
import { ExecutionTree } from './components/ExecutionTree'
import { InputTape } from './components/InputTape'
import { LearnCenter } from './components/LearnCenter'
import { MachineView } from './components/MachineView'
import { PDAEditor } from './components/PDAEditor'
import { RejectionContext } from './components/RejectionContext'
import { RejectionSummary } from './components/RejectionSummary'
import { StackTimeline } from './components/StackTimeline'
import { StackView } from './components/StackView'
import { TestBench } from './components/TestBench'
import { WorkspaceShare } from './components/WorkspaceShare'
import {
  appendHistoryEntry,
  canMoveBack,
  canMoveForward,
  createDebuggerHistory,
  historyCurrent,
  moveHistoryBack,
  moveHistoryForward,
  replaceHistoryPath,
  selectHistoryEntry,
} from './core/debugger/history'
import { describeTransition, initialConfiguration, matchingTransitions, nextConfigurations } from './core/pda/simulator'
import type { AcceptanceMode, Configuration, PDA } from './core/pda/types'
import { loadWorkspace, readWorkspaceFromUrl, saveWorkspace, type WorkspaceSnapshot } from './core/workspace/persistence'
import { anbnMachine } from './data/sampleMachine'
import './styles/app.css'

const defaultGrammar = 'S -> aSb | ε'

const speedOptions = [
  { label: '0.5×', ms: 1250 },
  { label: '1×', ms: 720 },
  { label: '1.5×', ms: 440 },
  { label: '2×', ms: 260 },
]

type AppView = 'workspace' | 'derivations' | 'analysis' | 'conversion' | 'designer' | 'tests' | 'challenges' | 'examples' | 'learn' | 'share'
type LearnTarget = 'derivations' | 'analysis' | 'conversion' | 'designer' | 'tests' | 'challenges' | 'examples'

export default function App() {
  const [boot] = useState(() => readWorkspaceFromUrl() ?? loadWorkspace())
  const bootMachine = boot?.machine ?? anbnMachine
  const bootInput = boot?.input ?? 'aaabbb'
  const bootMode = boot?.acceptanceMode ?? 'final-state'
  const [grammar, setGrammar] = useState(boot?.grammar ?? defaultGrammar)
  const [input, setInput] = useState(bootInput)
  const [acceptanceMode, setAcceptanceMode] = useState<AcceptanceMode>(bootMode)
  const [machine, setMachine] = useState<PDA>(bootMachine)
  const [debugHistory, setDebugHistory] = useState(() => createDebuggerHistory(initialConfiguration(bootMachine, bootInput, bootMode)))
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(720)
  const [view, setView] = useState<AppView>('workspace')
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [designerReturnView, setDesignerReturnView] = useState<AppView>('workspace')
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(boot?.activeChallengeId ?? null)
  const navigationMenuRef = useRef<HTMLDivElement>(null)
  const navigationTriggerRef = useRef<HTMLButtonElement>(null)

  const history = debugHistory.entries
  const activeIndex = debugHistory.cursor
  const current = historyCurrent(debugHistory)
  const previous = history[Math.max(0, activeIndex - 1)]
  const unread = current.input.slice(current.inputIndex) || 'ε'
  const transition = useMemo(
    () => machine.transitions.find((item) => item.id === current.transitionId),
    [machine, current.transitionId],
  )
  const availableTransitions = useMemo(() => matchingTransitions(machine, current), [machine, current])
  const workspaceSnapshot = useMemo(() => ({ grammar, input, acceptanceMode, machine, activeChallengeId }), [grammar, input, acceptanceMode, machine, activeChallengeId])

  const reset = (nextInput = input, mode = acceptanceMode, nextMachine = machine) => {
    setRunning(false)
    setDebugHistory(createDebuggerHistory(initialConfiguration(nextMachine, nextInput, mode)))
  }

  const step = () => {
    if (canMoveForward(debugHistory)) {
      setDebugHistory((previousHistory) => moveHistoryForward(previousHistory))
      return
    }
    if (current.status !== 'active') {
      setRunning(false)
      return
    }
    const next = nextConfigurations(machine, current, acceptanceMode, history.length - 1)
    setDebugHistory((previousHistory) => appendHistoryEntry(previousHistory, next[0]))
  }

  const moveBack = () => {
    setRunning(false)
    setDebugHistory((previousHistory) => moveHistoryBack(previousHistory))
  }

  const moveForward = () => {
    setRunning(false)
    setDebugHistory((previousHistory) => moveHistoryForward(previousHistory))
  }

  useEffect(() => {
    saveWorkspace(workspaceSnapshot)
  }, [workspaceSnapshot])

  useEffect(() => {
    if (!navigationOpen) return

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!navigationMenuRef.current?.contains(event.target as Node)) setNavigationOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setNavigationOpen(false)
      navigationTriggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [navigationOpen])

  useEffect(() => {
    if (!running) return
    if (current.status !== 'active' && !canMoveForward(debugHistory)) {
      setRunning(false)
      return
    }
    const timer = window.setTimeout(step, speed)
    return () => window.clearTimeout(timer)
  }, [running, speed, current.id, debugHistory.cursor, debugHistory.entries.length])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (view !== 'workspace') return
      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName))) return

      if (event.code === 'Space') {
        event.preventDefault()
        if (event.shiftKey) {
          if (current.status === 'active' || canMoveForward(debugHistory)) setRunning((value) => !value)
        } else {
          step()
        }
        return
      }

      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        if (canMoveBack(debugHistory)) moveBack()
        return
      }

      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault()
        if (canMoveForward(debugHistory)) moveForward()
        return
      }

      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'r') {
        event.preventDefault()
        reset(input)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [view, current.id, current.status, debugHistory, input, acceptanceMode, machine])

  const selectHistory = (index: number) => {
    setRunning(false)
    setDebugHistory((previousHistory) => selectHistoryEntry(previousHistory, index))
  }

  const loadBranchPath = (path: Configuration[]) => {
    if (!path.length) return
    setRunning(false)
    setDebugHistory(replaceHistoryPath(path))
  }

  const updateMode = (mode: AcceptanceMode) => {
    setAcceptanceMode(mode)
    reset(input, mode)
  }

  const replaceMachine = (nextMachine: PDA, nextView: AppView = 'workspace') => {
    setMachine(nextMachine)
    reset(input, acceptanceMode, nextMachine)
    setView(nextView)
  }

  const useGeneratedMachine = (nextMachine: PDA) => {
    setActiveChallengeId(null)
    replaceMachine(nextMachine)
  }

  const editMachine = (nextMachine: PDA) => {
    setMachine(nextMachine)
    reset(input, acceptanceMode, nextMachine)
  }

  const debugInput = (nextInput: string) => {
    setInput(nextInput)
    reset(nextInput)
    setView('workspace')
  }

  const openDesigner = (returnView: AppView = 'workspace') => {
    setDesignerReturnView(returnView)
    setView('designer')
  }

  const loadChallengeMachine = (nextMachine: PDA) => {
    setMachine(nextMachine)
    reset(input, acceptanceMode, nextMachine)
  }

  const applyAnalyzedGrammar = (source: string) => {
    setGrammar(source)
    setView('workspace')
  }

  const importWorkspace = (snapshot: WorkspaceSnapshot) => {
    setGrammar(snapshot.grammar)
    setInput(snapshot.input)
    setAcceptanceMode(snapshot.acceptanceMode)
    setMachine(snapshot.machine)
    setActiveChallengeId(snapshot.activeChallengeId ?? null)
    setRunning(false)
    setDebugHistory(createDebuggerHistory(initialConfiguration(snapshot.machine, snapshot.input, snapshot.acceptanceMode)))
    setView('workspace')
  }

  const openAnbnExperiment = (nextInput: string) => {
    setGrammar(defaultGrammar)
    setInput(nextInput)
    setAcceptanceMode('final-state')
    setMachine(anbnMachine)
    setActiveChallengeId(null)
    setRunning(false)
    setDebugHistory(createDebuggerHistory(initialConfiguration(anbnMachine, nextInput, 'final-state')))
    setView('workspace')
  }

  const navigateFromLearn = (target: LearnTarget) => {
    if (target === 'designer') openDesigner('learn')
    else setView(target)
  }

  const resultText = current.status === 'accepted'
    ? 'Input accepted by the current PDA.'
    : current.status === 'dead'
      ? current.reason || 'This computation branch terminated.'
      : current.status === 'limit'
        ? current.reason || 'Execution safety limit reached.'
        : `${availableTransitions.length} transition${availableTransitions.length === 1 ? '' : 's'} currently enabled.`

  return (
    <main className="app-shell">
      <a className="skip-link" href="#stacktrace-content">Skip to StackTrace content</a>
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true"><span /></div>
          <div><strong>StackTrace</strong><span>CFG + PDA visual debugger</span></div>
        </div>
        <div className="nav-cluster">
          <nav aria-label="Primary workspace views">
            <button aria-pressed={view === 'workspace'} className={view === 'workspace' ? 'active-tab' : ''} onClick={() => setView('workspace')}>Workspace</button>
            <button aria-pressed={view === 'designer'} className={view === 'designer' ? 'active-tab' : ''} onClick={() => openDesigner('workspace')}>Designer</button>
            <button aria-pressed={view === 'tests'} className={view === 'tests' ? 'active-tab' : ''} onClick={() => setView('tests')}>Tests</button>
            <button aria-pressed={view === 'challenges'} className={view === 'challenges' ? 'active-tab' : ''} onClick={() => setView('challenges')}>Challenges</button>
            <button aria-pressed={view === 'learn'} className={view === 'learn' ? 'active-tab' : ''} onClick={() => setView('learn')}>Learn</button>
          </nav>
          <div className="nav-overflow" ref={navigationMenuRef}>
            <button ref={navigationTriggerRef} className="nav-overflow-trigger" aria-expanded={navigationOpen} aria-controls="secondary-navigation" onClick={() => setNavigationOpen((open) => !open)}>Explore</button>
            {navigationOpen && <div className="nav-menu" id="secondary-navigation" role="group" aria-label="More workspace views">
              <button aria-pressed={view === 'derivations'} className={view === 'derivations' ? 'active-tab' : ''} onClick={() => { setView('derivations'); setNavigationOpen(false) }}>Derive</button>
              <button aria-pressed={view === 'analysis'} className={view === 'analysis' ? 'active-tab' : ''} onClick={() => { setView('analysis'); setNavigationOpen(false) }}>Analyze</button>
              <button aria-pressed={view === 'conversion'} className={view === 'conversion' ? 'active-tab' : ''} onClick={() => { setView('conversion'); setNavigationOpen(false) }}>CFG → PDA</button>
              <button onClick={() => {
                setView('workspace')
                setNavigationOpen(false)
                window.setTimeout(() => document.getElementById('execution-tree')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
              }}>Tree</button>
              <button aria-pressed={view === 'examples'} className={view === 'examples' ? 'active-tab' : ''} onClick={() => { setView('examples'); setNavigationOpen(false) }}>Examples</button>
              <button aria-pressed={view === 'share'} className={view === 'share' ? 'active-tab' : ''} onClick={() => { setView('share'); setNavigationOpen(false) }}>Share</button>
            </div>}
          </div>
        </div>
        <div className={`status-badge ${current.status}`}><span className="status-light" />{current.status.toUpperCase()}</div>
      </header>

      <div id="stacktrace-content">
      {view === 'derivations' ? (
        <DerivationExplorer grammarSource={grammar} target={input} onBack={() => setView('workspace')} />
      ) : view === 'analysis' ? (
        <CFGAnalysis grammarSource={grammar} onApplyGrammar={applyAnalyzedGrammar} onBack={() => setView('workspace')} />
      ) : view === 'conversion' ? (
        <ConversionExplorer grammarSource={grammar} target={input} onBack={() => setView('workspace')} onUseMachine={useGeneratedMachine} />
      ) : view === 'designer' ? (
        <PDAEditor machine={machine} onChange={editMachine} onBack={() => setView(designerReturnView)} />
      ) : view === 'tests' ? (
        <TestBench machine={machine} mode={acceptanceMode} onBack={() => setView('workspace')} onDebugInput={debugInput} />
      ) : view === 'challenges' ? (
        <ChallengeMode
          machine={machine}
          mode={acceptanceMode}
          activeChallengeId={activeChallengeId}
          onSetActiveChallenge={setActiveChallengeId}
          onLoadMachine={loadChallengeMachine}
          onOpenDesigner={() => openDesigner('challenges')}
          onBack={() => setView('workspace')}
        />
      ) : view === 'examples' ? (
        <ExampleLibrary workspace={workspaceSnapshot} onLoad={importWorkspace} onBack={() => setView('workspace')} />
      ) : view === 'learn' ? (
        <LearnCenter onBack={() => setView('workspace')} onOpenDebugger={openAnbnExperiment} onNavigate={navigateFromLearn} />
      ) : view === 'share' ? (
        <WorkspaceShare workspace={workspaceSnapshot} onImport={importWorkspace} onBack={() => setView('workspace')} />
      ) : <>
      <section className="run-strip" aria-live="polite">
        <div className="run-state"><span className={`pulse ${running ? 'running' : ''}`} /><b>{running ? 'RUNNING' : 'DEBUG READY'}</b><span>{resultText}</span></div>
        <div className="run-metrics">
          <span><small>STEP</small><b>{activeIndex}/{history.length - 1}</b></span>
          <span><small>STATE</small><b>{current.state}</b></span>
          <span><small>UNREAD</small><b>{unread}</b></span>
          <span><small>STACK</small><b>{current.stack.length}</b></span>
          <span><small>BRANCHES</small><b>{availableTransitions.length}</b></span>
        </div>
      </section>

      <div className="workspace-grid">
        <CFGEditor value={grammar} onChange={setGrammar} />
        <MachineView machine={machine} activeState={current.state} activeTransitionId={current.transitionId} />
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
          <div className="panel-heading"><div><span>DEBUG INPUT</span><span className="heading-separator">/</span><span>PLAYBACK</span></div><span>SPACE STEP · ⇧SPACE RUN · ALT+←/→ TIME TRAVEL</span></div>
          <InputTape input={current.input} inputIndex={current.inputIndex} />

          <div className="debug-input-row">
            <label><span>TEST STRING</span><input value={input} onChange={(event) => setInput(event.target.value.replace(/\s/g, ''))} onKeyDown={(event) => event.key === 'Enter' && reset(input)} spellCheck={false} /></label>
            <button className="load-button" onClick={() => reset(input)}>Load input</button>
          </div>

          <div className="playback-row">
            <div className="controls">
              <button disabled={!canMoveBack(debugHistory)} onClick={moveBack} title="Previous saved configuration">← Back</button>
              <button disabled={!canMoveForward(debugHistory)} onClick={moveForward} title="Next saved configuration">Forward →</button>
              <button className="primary-control" onClick={step} disabled={current.status !== 'active' && !canMoveForward(debugHistory)}>Step →</button>
              <button className={running ? 'pause-control' : ''} onClick={() => setRunning((value) => !value)} disabled={current.status !== 'active' && !canMoveForward(debugHistory)}>{running ? 'Pause' : '▶ Run'}</button>
              <button onClick={() => reset(input)}>↻ Reset</button>
            </div>
            <label className="speed-control">Speed<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>{speedOptions.map((option) => <option key={option.ms} value={option.ms}>{option.label}</option>)}</select></label>
          </div>

          <div className="acceptance-control" role="group" aria-label="PDA acceptance mode">
            <span>ACCEPT BY</span>
            <button aria-pressed={acceptanceMode === 'final-state'} className={acceptanceMode === 'final-state' ? 'selected' : ''} onClick={() => updateMode('final-state')}>Final state</button>
            <button aria-pressed={acceptanceMode === 'empty-stack'} className={acceptanceMode === 'empty-stack' ? 'selected' : ''} onClick={() => updateMode('empty-stack')}>Empty stack</button>
          </div>

          {current.status === 'dead' && <div className="rejection"><div className="rejection-icon">×</div><div><strong>BRANCH TERMINATED</strong><span>{current.reason}</span><small>Use Back to inspect C{Math.max(0, activeIndex - 1)} without deleting later history.</small><RejectionContext machine={machine} config={current} /><RejectionSummary machine={machine} input={current.input} mode={acceptanceMode} /></div></div>}
          {current.status === 'limit' && <div className="execution-limit"><div className="limit-icon">!</div><div><strong>EXECUTION LIMIT</strong><span>{current.reason || 'A safety limit stopped this branch.'}</span><RejectionSummary machine={machine} input={current.input} mode={acceptanceMode} /></div></div>}
          {current.status === 'accepted' && <div className="acceptance"><div className="acceptance-icon">✓</div><div><strong>STRING ACCEPTED</strong><span>The selected acceptance condition is satisfied with all input consumed.</span></div></div>}
        </section>

        <section className="telemetry-column">
          <StackTimeline history={history} activeIndex={activeIndex} onSelect={selectHistory} />
          <ExecutionTree machine={machine} input={current.input} mode={acceptanceMode} onSelectPath={loadBranchPath} />
          <ExecutionTrace machine={machine} history={history} activeIndex={activeIndex} onSelect={selectHistory} />
        </section>
      </section>
      </>}
      </div>
    </main>
  )
}
