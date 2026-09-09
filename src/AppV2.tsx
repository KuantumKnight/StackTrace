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
import { cfgToPda } from './core/cfg/cfgToPda'
import { parseGrammar } from './core/cfg/grammarParser'
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
import './styles/studio-v2.css'

const defaultGrammar = 'S -> aSb | ε'

const speedOptions = [
  { label: '0.5×', ms: 1250 },
  { label: '1×', ms: 720 },
  { label: '1.5×', ms: 440 },
  { label: '2×', ms: 260 },
]

type AppView = 'workspace' | 'derivations' | 'analysis' | 'conversion' | 'designer' | 'tests' | 'challenges' | 'examples' | 'learn' | 'share'
type LearnTarget = 'derivations' | 'analysis' | 'conversion' | 'designer' | 'tests' | 'challenges' | 'examples'
type InspectorView = 'trace' | 'tree' | 'timeline'

function statusLabel(status: Configuration['status']) {
  if (status === 'accepted') return 'ACCEPTED'
  if (status === 'dead') return 'BRANCH DEAD'
  if (status === 'limit') return 'SEARCH LIMIT'
  if (status === 'merged') return 'BRANCH MERGED'
  return 'READY'
}

export default function AppV2() {
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
  const [inspectorView, setInspectorView] = useState<InspectorView>('trace')
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
  const workspaceSnapshot = useMemo(
    () => ({ grammar, input, acceptanceMode, machine, activeChallengeId }),
    [grammar, input, acceptanceMode, machine, activeChallengeId],
  )

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

  const buildPdaFromGrammar = () => {
    try {
      useGeneratedMachine(cfgToPda(parseGrammar(grammar)).machine)
    } catch {
      // CFGEditor disables this action while the grammar is invalid.
    }
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

  useEffect(() => {
    const onExperienceNavigate = (event: Event) => {
      const destination = (event as CustomEvent<'debug' | 'learn' | 'build' | 'practice'>).detail
      if (destination === 'debug') setView('workspace')
      if (destination === 'learn') setView('learn')
      if (destination === 'practice') setView('challenges')
      if (destination === 'build') openDesigner('workspace')
    }
    window.addEventListener('stacktrace:navigate', onExperienceNavigate)
    return () => window.removeEventListener('stacktrace:navigate', onExperienceNavigate)
  }, [])

  const loadChallengeMachine = (nextMachine: PDA, mode: AcceptanceMode) => {
    setMachine(nextMachine)
    setAcceptanceMode(mode)
    reset(input, mode, nextMachine)
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
    ? 'Accepted: the selected acceptance condition is satisfied.'
    : current.status === 'dead'
      ? current.reason || 'This computation branch has no legal next move.'
      : current.status === 'limit'
        ? current.reason || 'Search stopped at the configured safety limit.'
        : current.status === 'merged'
          ? current.reason || 'This branch shares a previously explored configuration.'
        : `${availableTransitions.length} valid move${availableTransitions.length === 1 ? '' : 's'} from this configuration.`

  const runAvailable = current.status === 'active' || canMoveForward(debugHistory)

  return (
    <main className="app-shell studio-shell">
      <a className="skip-link" href="#stacktrace-content">Skip to StackTrace content</a>

      <header className="topbar studio-topbar">
        <button className="brand-block brand-button" type="button" onClick={() => setView('workspace')} aria-label="Open StackTrace debugger">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-copy"><strong>StackTrace</strong><span>Formal language debugger</span></span>
        </button>

        <div className="nav-cluster">
          <nav aria-label="Primary workspace views">
            <button aria-pressed={view === 'workspace'} className={view === 'workspace' ? 'active-tab' : ''} onClick={() => setView('workspace')}>Debug</button>
            <button aria-pressed={view === 'learn'} className={view === 'learn' ? 'active-tab' : ''} onClick={() => setView('learn')}>Learn</button>
            <button aria-pressed={view === 'designer'} className={view === 'designer' ? 'active-tab' : ''} onClick={() => openDesigner('workspace')}>Build</button>
            <button aria-label="Challenges" aria-pressed={view === 'challenges'} className={view === 'challenges' ? 'active-tab' : ''} onClick={() => setView('challenges')}>Practice</button>
          </nav>
          <div className="nav-overflow" ref={navigationMenuRef}>
            <button ref={navigationTriggerRef} className="nav-overflow-trigger" aria-expanded={navigationOpen} aria-controls="secondary-navigation" onClick={() => setNavigationOpen((open) => !open)}>More</button>
            {navigationOpen && (
              <div className="nav-menu" id="secondary-navigation" role="menu" aria-label="More StackTrace tools">
                <button role="menuitem" aria-pressed={view === 'derivations'} className={view === 'derivations' ? 'active-tab' : ''} onClick={() => { setView('derivations'); setNavigationOpen(false) }}>Derivations</button>
                <button role="menuitem" aria-pressed={view === 'analysis'} className={view === 'analysis' ? 'active-tab' : ''} onClick={() => { setView('analysis'); setNavigationOpen(false) }}>CFG analysis</button>
                <button role="menuitem" aria-pressed={view === 'conversion'} className={view === 'conversion' ? 'active-tab' : ''} onClick={() => { setView('conversion'); setNavigationOpen(false) }}>CFG → PDA</button>
                <button role="menuitem" aria-pressed={view === 'tests'} className={view === 'tests' ? 'active-tab' : ''} onClick={() => { setView('tests'); setNavigationOpen(false) }}>Test bench</button>
                <button role="menuitem" aria-pressed={view === 'examples'} className={view === 'examples' ? 'active-tab' : ''} onClick={() => { setView('examples'); setNavigationOpen(false) }}>Examples</button>
                <button role="menuitem" onClick={() => {
                  setView('workspace')
                  setInspectorView('tree')
                  setNavigationOpen(false)
                  window.setTimeout(() => document.getElementById('workspace-inspector')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
                }}>Execution tree</button>
                <button role="menuitem" aria-pressed={view === 'share'} className={view === 'share' ? 'active-tab' : ''} onClick={() => { setView('share'); setNavigationOpen(false) }}>Share workspace</button>
              </div>
            )}
          </div>
        </div>

        {view === 'workspace' ? (
          <div className={`status-badge ${current.status}`}><span className="status-light" />{statusLabel(current.status)}</div>
        ) : (
          <button className="return-debugger" onClick={() => setView('workspace')}>Back to debugger</button>
        )}
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
        ) : (
          <>
            <section className="workspace-hero" aria-live="polite">
              <div className="hero-copy">
                <div className="eyebrow"><span className={`pulse ${running ? 'running' : ''}`} />LIVE TRACE · aⁿbⁿ</div>
                <h1>See exactly why a PDA accepts a string.</h1>
                <p>For the sample grammar, every <code>a</code> stores work on the stack and every <code>b</code> removes it. Step through the machine and watch the proof happen.</p>
                <div className="hero-actions">
                  <button className="hero-run" onClick={() => setRunning((value) => !value)} disabled={!runAvailable}>{running ? 'Pause trace' : 'Run trace'}</button>
                  <button onClick={step} disabled={!runAvailable}>Step once →</button>
                  <button className="quiet-action" onClick={() => setView('learn')}>Explain the concept</button>
                </div>
              </div>
              <div className="hero-readout" aria-label="Current PDA configuration summary">
                <span><small>STATE</small><strong>{current.state}</strong></span>
                <span><small>UNREAD INPUT</small><strong>{unread}</strong></span>
                <span><small>STACK DEPTH</small><strong>{current.stack.length}</strong></span>
                <span><small>VALID MOVES</small><strong>{availableTransitions.length}</strong></span>
                <div className="hero-result"><small>NOW</small><strong>{resultText}</strong></div>
              </div>
            </section>

            <section className="learning-thread" aria-label="Debugger learning sequence">
              <span><b>01</b> Define the language</span>
              <i aria-hidden="true">→</i>
              <span><b>02</b> Trace the state graph</span>
              <i aria-hidden="true">→</i>
              <span><b>03</b> Watch stack memory</span>
              <i aria-hidden="true">→</i>
              <span><b>04</b> Explain the outcome</span>
            </section>

            <div className="workspace-stage">
              <aside className="setup-rail">
                <div className="rail-intro"><span>01</span><div><small>LANGUAGE</small><strong>Define what should be recognized.</strong></div></div>
                <CFGEditor value={grammar} onChange={setGrammar} onBuild={buildPdaFromGrammar} />

                <section className="panel input-setup-panel">
                  <div className="panel-heading"><div><span>INPUT</span><span className="heading-separator">/</span><span>ACCEPTANCE</span></div><span>TRY A STRING</span></div>
                  <label className="test-string-field">
                    <span>TEST STRING</span>
                    <input value={input} onChange={(event) => setInput(event.target.value.replace(/\s/g, ''))} onKeyDown={(event) => event.key === 'Enter' && reset(input)} spellCheck={false} />
                  </label>
                  <button className="load-button" onClick={() => reset(input)}>Load input</button>
                  <div className="acceptance-control" role="group" aria-label="PDA acceptance mode">
                    <span>ACCEPT BY</span>
                    <button aria-pressed={acceptanceMode === 'final-state'} className={acceptanceMode === 'final-state' ? 'selected' : ''} onClick={() => updateMode('final-state')}>Final state</button>
                    <button aria-pressed={acceptanceMode === 'empty-stack'} className={acceptanceMode === 'empty-stack' ? 'selected' : ''} onClick={() => updateMode('empty-stack')}>Empty stack</button>
                  </div>
                </section>
              </aside>

              <section className="machine-stage">
                <div className="rail-intro machine-intro"><span>02</span><div><small>STATE GRAPH</small><strong>Follow the active transition.</strong></div></div>
                <MachineView machine={machine} activeState={current.state} activeTransitionId={current.transitionId} />
              </section>

              <aside className="memory-rail">
                <div className="rail-intro"><span>03</span><div><small>MEMORY</small><strong>Watch the stack explain context.</strong></div></div>
                <StackView stack={current.stack} previousStack={previous.stack} />

                <section className="panel configuration-card">
                  <div className="panel-heading"><div><span>CONFIGURATION</span><span className="heading-separator">/</span><span>C{activeIndex}</span></div><span>{acceptanceMode === 'final-state' ? 'FINAL STATE' : 'EMPTY STACK'}</span></div>
                  <div className="configuration-focus">
                    <span><small>CURRENT STATE</small><strong>{current.state}</strong></span>
                    <span><small>INPUT HEAD</small><strong>{current.input[current.inputIndex] ?? 'ε'}</strong></span>
                  </div>
                  <dl>
                    <dt>Unread input</dt><dd>{unread}</dd>
                    <dt>Stack top</dt><dd>{current.stack[0] ?? 'ε'}</dd>
                    <dt>Depth</dt><dd>{current.depth}</dd>
                    <dt>Transition</dt><dd>{transition ? `${transition.input || 'ε'}, ${transition.stackTop || 'ε'} → ${transition.replacement || 'ε'}` : 'initial configuration'}</dd>
                  </dl>
                  <div className="semantics-note"><small>WHAT JUST HAPPENED</small><span>{describeTransition(transition)}</span></div>
                </section>
              </aside>
            </div>

            <section className="panel playback-dock">
              <div className="playback-heading">
                <div><small>04 · PLAYBACK</small><strong>Move through configurations without losing history.</strong></div>
                <span>Space step · Shift+Space run · Alt+←/→ time travel</span>
              </div>
              <InputTape input={current.input} inputIndex={current.inputIndex} />
              <div className="playback-controls-row">
                <div className="controls">
                  <button disabled={!canMoveBack(debugHistory)} onClick={moveBack}>← Back</button>
                  <button disabled={!canMoveForward(debugHistory)} onClick={moveForward}>Forward →</button>
                  <button className="primary-control" onClick={step} disabled={!runAvailable}>Step →</button>
                  <button className={running ? 'pause-control' : ''} onClick={() => setRunning((value) => !value)} disabled={!runAvailable}>{running ? 'Pause' : '▶ Run'}</button>
                  <button onClick={() => reset(input)}>↻ Reset</button>
                </div>
                <label className="speed-control">Playback speed<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>{speedOptions.map((option) => <option key={option.ms} value={option.ms}>{option.label}</option>)}</select></label>
              </div>

              {current.status === 'dead' && (
                <div className="rejection">
                  <div className="rejection-icon">×</div>
                  <div>
                    <strong>BRANCH TERMINATED</strong>
                    <span>{current.reason}</span>
                    <small>This branch has no valid move. That alone does not prove the NPDA rejects the input.</small>
                    <RejectionContext machine={machine} config={current} />
                    <RejectionSummary machine={machine} input={current.input} mode={acceptanceMode} />
                  </div>
                </div>
              )}
              {current.status === 'limit' && (
                <div className="execution-limit">
                  <div className="limit-icon">!</div>
                  <div><strong>SEARCH LIMIT</strong><span>{current.reason || 'A safety limit stopped this branch.'}</span><RejectionSummary machine={machine} input={current.input} mode={acceptanceMode} /></div>
                </div>
              )}
              {current.status === 'accepted' && (
                <div className="acceptance">
                  <div className="acceptance-icon">✓</div>
                  <div><strong>STRING ACCEPTED</strong><span>The selected acceptance condition is satisfied with all input consumed.</span></div>
                </div>
              )}
            </section>

            <section className="panel inspector-shell" id="workspace-inspector">
              <div className="inspector-heading">
                <div><small>DEEP INSPECTION</small><strong>Open one lens at a time.</strong></div>
                <div className="inspector-tabs" role="tablist" aria-label="Debugger inspection views">
                  <button id="inspector-tab-trace" role="tab" aria-selected={inspectorView === 'trace'} aria-controls="inspector-panel" className={inspectorView === 'trace' ? 'selected' : ''} onClick={() => setInspectorView('trace')}>Trace</button>
                  <button id="inspector-tab-tree" role="tab" aria-selected={inspectorView === 'tree'} aria-controls="inspector-panel" className={inspectorView === 'tree' ? 'selected' : ''} onClick={() => setInspectorView('tree')}>Execution tree</button>
                  <button id="inspector-tab-timeline" role="tab" aria-selected={inspectorView === 'timeline'} aria-controls="inspector-panel" className={inspectorView === 'timeline' ? 'selected' : ''} onClick={() => setInspectorView('timeline')}>Stack depth</button>
                </div>
              </div>
              <div id="inspector-panel" className="inspector-body" role="tabpanel" tabIndex={0} aria-labelledby={`inspector-tab-${inspectorView}`}>
                {inspectorView === 'trace' ? (
                  <ExecutionTrace machine={machine} history={history} activeIndex={activeIndex} onSelect={selectHistory} />
                ) : inspectorView === 'tree' ? (
                  <ExecutionTree machine={machine} input={current.input} mode={acceptanceMode} onSelectPath={loadBranchPath} />
                ) : (
                  <StackTimeline history={history} activeIndex={activeIndex} onSelect={selectHistory} />
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
