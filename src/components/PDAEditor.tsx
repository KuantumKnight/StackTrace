import { useEffect, useMemo, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { createState, createTransition, validatePDA } from '../core/pda/editor'
import type { PDA, PDAState, PDATransition } from '../core/pda/types'
import { layoutPDAEdges } from './pdaEditorLayout'
import '../styles/pdaEditor.css'

interface PDAEditorProps {
  machine: PDA
  onChange: (machine: PDA) => void
  onBack: () => void
}

const WIDTH = 720
const HEIGHT = 430
const GRID = 12
const MIN_ZOOM = 0.7
const MAX_ZOOM = 1.5

function label(transition: PDATransition) {
  return `${transition.input || 'ε'}, ${transition.stackTop || 'ε'} → ${transition.replacement || 'ε'}`
}

function normalizeSymbol(value: string) {
  return value.trim() || 'ε'
}

export function PDAEditor({ machine, onChange, onBack }: PDAEditorProps) {
  const [selectedStateId, setSelectedStateId] = useState(machine.startState)
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [zoom, setZoom] = useState(1)

  const selectedState = machine.states.find((state) => state.id === selectedStateId) || machine.states[0]
  const selectedTransition = machine.transitions.find((transition) => transition.id === selectedTransitionId)
  const diagnostics = useMemo(() => validatePDA(machine), [machine])
  const errorCount = diagnostics.filter((item) => item.level === 'error').length
  const warningCount = diagnostics.filter((item) => item.level === 'warning').length
  const acceptingCount = machine.states.filter((state) => state.accepting).length
  const edgeLayouts = useMemo(
    () => new Map(layoutPDAEdges(machine, WIDTH, HEIGHT).map((layout) => [layout.transitionId, layout])),
    [machine],
  )

  const patchState = (id: string, patch: Partial<PDAState>) => {
    onChange({ ...machine, states: machine.states.map((state) => state.id === id ? { ...state, ...patch } : state) })
  }

  const patchTransition = (id: string, patch: Partial<PDATransition>) => {
    onChange({ ...machine, transitions: machine.transitions.map((transition) => transition.id === id ? { ...transition, ...patch } : transition) })
  }

  const addState = () => {
    const state = createState(machine, 130 + (machine.states.length * 110) % 470, 260 + (machine.states.length % 2) * 70)
    const nextState = snapToGrid ? { ...state, x: Math.round(state.x / GRID) * GRID, y: Math.round(state.y / GRID) * GRID } : state
    onChange({ ...machine, states: [...machine.states, nextState] })
    setSelectedStateId(nextState.id)
    setSelectedTransitionId(null)
  }

  const deleteState = () => {
    if (!selectedState || machine.states.length <= 1) return
    const remaining = machine.states.filter((state) => state.id !== selectedState.id)
    const startState = machine.startState === selectedState.id ? remaining[0].id : machine.startState
    onChange({
      ...machine,
      startState,
      states: remaining.map((state) => ({ ...state, initial: state.id === startState })),
      transitions: machine.transitions.filter((transition) => transition.from !== selectedState.id && transition.to !== selectedState.id),
    })
    setSelectedStateId(remaining[0].id)
    setSelectedTransitionId(null)
  }

  const setStart = () => {
    if (!selectedState) return
    onChange({
      ...machine,
      startState: selectedState.id,
      states: machine.states.map((state) => ({ ...state, initial: state.id === selectedState.id })),
    })
  }

  const addTransition = () => {
    const transition = createTransition(machine, selectedState?.id)
    onChange({ ...machine, transitions: [...machine.transitions, transition] })
    setSelectedTransitionId(transition.id)
    setSelectedStateId(transition.from)
  }

  const deleteTransition = () => {
    if (!selectedTransition) return
    onChange({ ...machine, transitions: machine.transitions.filter((transition) => transition.id !== selectedTransition.id) })
    setSelectedTransitionId(null)
  }

  const moveState = (event: ReactPointerEvent<SVGGElement>, stateId: string) => {
    if (draggingId !== stateId) return
    const svg = event.currentTarget.ownerSVGElement
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const canvasX = ((event.clientX - rect.left) / rect.width) * WIDTH
    const canvasY = ((event.clientY - rect.top) / rect.height) * HEIGHT
    const xAtCanvasScale = WIDTH / 2 + (canvasX - WIDTH / 2) / zoom
    const yAtCanvasScale = HEIGHT / 2 + (canvasY - HEIGHT / 2) / zoom
    let x = Math.min(WIDTH - 45, Math.max(45, xAtCanvasScale))
    let y = Math.min(HEIGHT - 45, Math.max(55, yAtCanvasScale))
    if (snapToGrid) {
      x = Math.round(x / GRID) * GRID
      y = Math.round(y / GRID) * GRID
    }
    patchState(stateId, { x: Math.round(x), y: Math.round(y) })
  }

  const nudge = (dx: number, dy: number) => {
    if (!selectedState) return
    const nextX = Math.min(WIDTH - 45, Math.max(45, selectedState.x + dx))
    const nextY = Math.min(HEIGHT - 45, Math.max(55, selectedState.y + dy))
    patchState(selectedState.id, {
      x: snapToGrid ? Math.round(nextX / GRID) * GRID : nextX,
      y: snapToGrid ? Math.round(nextY / GRID) * GRID : nextY,
    })
  }

  const zoomBy = (delta: number) => setZoom((value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((value + delta) * 100) / 100)))

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName))) return

      if (event.key.toLowerCase() === 'a') {
        event.preventDefault()
        addState()
        return
      }
      if (event.key.toLowerCase() === 'e') {
        event.preventDefault()
        addTransition()
        return
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault()
        if (selectedTransition) deleteTransition()
        else deleteState()
        return
      }
      const step = event.shiftKey ? GRID * 2 : GRID
      if (event.key === 'ArrowUp') { event.preventDefault(); nudge(0, -step) }
      if (event.key === 'ArrowDown') { event.preventDefault(); nudge(0, step) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); nudge(-step, 0) }
      if (event.key === 'ArrowRight') { event.preventDefault(); nudge(step, 0) }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [machine, selectedStateId, selectedTransitionId, snapToGrid])

  return (
    <section className="designer-workspace build-workbench">
      <header className="builder-header">
        <div className="builder-kicker">
          <button className="builder-back" onClick={onBack}>← Debugger</button>
          <span>BUILD / PDA WORKBENCH</span>
        </div>

        <div className="builder-hero-row">
          <div className="builder-title-block">
            <h1>PDA workbench</h1>
          </div>

          <div className="builder-primary-actions">
            <label className="bottom-symbol-control">
              <small>INITIAL STACK</small>
              <input aria-label="Initial stack symbol" value={machine.initialStackSymbol} maxLength={1} onChange={(event) => onChange({ ...machine, initialStackSymbol: event.target.value || 'Z' })} />
            </label>
            <button className="debug-machine-button" onClick={onBack}>Debug machine <span>→</span></button>
          </div>
        </div>

        <div className="builder-metrics" aria-label="Machine summary">
          <span><small>STATES</small><strong>{machine.states.length}</strong></span>
          <span><small>TRANSITIONS</small><strong>{machine.transitions.length}</strong></span>
          <span><small>ACCEPTING</small><strong>{acceptingCount}</strong></span>
          <span className={errorCount ? 'metric-danger' : warningCount ? 'metric-warning' : 'metric-ok'}>
            <small>MACHINE HEALTH</small>
            <strong>{errorCount ? `${errorCount} error${errorCount === 1 ? '' : 's'}` : warningCount ? `${warningCount} warning${warningCount === 1 ? '' : 's'}` : 'Valid'}</strong>
          </span>
        </div>
      </header>

      <div className="designer-grid">
        <aside className="panel machine-objects-panel">
          <div className="builder-panel-title">
            <div><small>01 · OBJECTS</small><strong>Machine map</strong></div>
            <span>{machine.states.length + machine.transitions.length} objects</span>
          </div>

          <div className="object-section-heading"><span>STATES</span><button onClick={addState}>+ State <kbd>A</kbd></button></div>
          <div className="state-object-list">
            {machine.states.map((state, index) => (
              <button key={state.id} className={selectedState?.id === state.id && !selectedTransition ? 'selected' : ''} onClick={() => { setSelectedStateId(state.id); setSelectedTransitionId(null) }}>
                <span className={`state-mini-dot ${state.accepting ? 'accepting' : ''}`} />
                <span className="object-copy"><b>{state.name}</b><small>{state.id === machine.startState ? 'Start state' : state.accepting ? 'Accepting state' : 'Standard state'}</small></span>
                <span className="object-index">{String(index + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>

          <div className="object-section-heading"><span>TRANSITIONS</span><button onClick={addTransition} disabled={!machine.states.length}>+ Edge <kbd>E</kbd></button></div>
          <div className="transition-object-list">
            {machine.transitions.map((transition) => (
              <button key={transition.id} className={selectedTransition?.id === transition.id ? 'selected' : ''} onClick={() => { setSelectedTransitionId(transition.id); setSelectedStateId(transition.from) }}>
                <span className="edge-route"><b>{transition.from}</b><i>→</i><b>{transition.to}</b></span>
                <small>{label(transition)}</small>
              </button>
            ))}
            {!machine.transitions.length && <span className="empty-object-list"><b>No transitions yet.</b><small>Select a state and press E to create one.</small></span>}
          </div>
        </aside>

        <section className="panel designer-canvas-panel">
          <div className="builder-panel-title canvas-title-row">
            <div><small>02 · CANVAS</small><strong>Machine topology</strong></div>
            <span>Drag to compose · {snapToGrid ? `${GRID}px snap` : 'free placement'}</span>
          </div>

          <div className="designer-canvas">
            <div className="canvas-tool-rail" role="toolbar" aria-label="Canvas tools">
              <button onClick={addState} title="Add state (A)"><b>+</b><span>State</span></button>
              <button onClick={addTransition} title="Add transition (E)"><b>↗</b><span>Edge</span></button>
              <button className={snapToGrid ? 'active' : ''} aria-pressed={snapToGrid} onClick={() => setSnapToGrid((value) => !value)} title="Toggle snap to grid"><b>⌗</b><span>Snap</span></button>
              <span className="tool-rail-separator" aria-hidden="true" />
              <button onClick={() => zoomBy(-0.1)} title="Zoom out" disabled={zoom <= MIN_ZOOM}><b>−</b></button>
              <button className="zoom-readout" onClick={() => setZoom(1)} title="Fit to view">{Math.round(zoom * 100)}%</button>
              <button onClick={() => zoomBy(0.1)} title="Zoom in" disabled={zoom >= MAX_ZOOM}><b>+</b></button>
            </div>

            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-label="Editable PDA graph">
              <defs>
                <marker id="editor-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3.5" orient="auto"><path d="M0,0 L0,7 L8,3.5 z" /></marker>
                <filter id="editor-node-shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity=".12" /></filter>
              </defs>

              <g className="builder-scene" style={{ transform: `translate(${WIDTH / 2}px, ${HEIGHT / 2}px) scale(${zoom}) translate(${-WIDTH / 2}px, ${-HEIGHT / 2}px)` }}>
                {machine.transitions.map((transition) => {
                  const geometry = edgeLayouts.get(transition.id)
                  if (!geometry) return null
                  const selected = selectedTransition?.id === transition.id
                  const text = label(transition)
                  const width = geometry.width
                  return (
                    <g key={transition.id} className={`designer-edge ${selected ? 'selected' : ''}`} onClick={() => { setSelectedTransitionId(transition.id); setSelectedStateId(transition.from) }}>
                      <path className="designer-edge-hit" d={geometry.d} />
                      <path className="designer-edge-line" d={geometry.d} markerEnd="url(#editor-arrow)" />
                      <g className="designer-edge-chip" transform={`translate(${geometry.x} ${geometry.y})`}>
                        <rect x={-width / 2} y="-12" width={width} height="24" rx="7" />
                        <text textAnchor="middle" y="3.5">{text}</text>
                      </g>
                    </g>
                  )
                })}

                {machine.states.map((state) => {
                  const selected = selectedState?.id === state.id && !selectedTransition
                  return (
                    <g
                      key={state.id}
                      className={`designer-state ${selected ? 'selected' : ''}`}
                      transform={`translate(${state.x} ${state.y})`}
                      onPointerDown={(event) => { setSelectedStateId(state.id); setSelectedTransitionId(null); setDraggingId(state.id); event.currentTarget.setPointerCapture(event.pointerId) }}
                      onPointerMove={(event) => moveState(event, state.id)}
                      onPointerUp={() => setDraggingId(null)}
                      onPointerCancel={() => setDraggingId(null)}
                    >
                      {state.id === machine.startState && <path className="designer-start-arrow" d="M -67 0 L -42 0" markerEnd="url(#editor-arrow)" />}
                      {selected && <circle className="selection-halo" r="44" />}
                      <circle className="state-body" r="34" filter="url(#editor-node-shadow)" />
                      {state.accepting && <circle className="accepting-ring" r="27" />}
                      <text textAnchor="middle" y="4.5">{state.name}</text>
                      <text className="designer-state-role" textAnchor="middle" y="54">{state.id === machine.startState ? 'START' : state.accepting ? 'FINAL' : ''}</text>
                    </g>
                  )
                })}
              </g>
            </svg>

            <div className="canvas-status-bar">
              <span><i className={snapToGrid ? 'status-dot on' : 'status-dot'} />{snapToGrid ? 'Snap enabled' : 'Free placement'}</span>
              <span>Arrow keys nudge · Shift = ×2 · Delete removes selection · {Math.round(zoom * 100)}% zoom</span>
            </div>
          </div>
        </section>

        <aside className="panel property-panel">
          <div className="builder-panel-title">
            <div><small>03 · INSPECTOR</small><strong>{selectedTransition ? 'Transition' : selectedState ? 'State' : 'Nothing selected'}</strong></div>
            <span>{selectedTransition ? selectedTransition.id : selectedState?.id ?? '—'}</span>
          </div>

          {selectedTransition ? (
            <div className="transition-properties">
              <div className="inspector-context"><small>FORMAL RULE</small><strong>{label(selectedTransition)}</strong><span>{selectedTransition.from} → {selectedTransition.to}</span></div>
              <div className="property-grid two-up">
                <label><span>FROM</span><select value={selectedTransition.from} onChange={(event) => patchTransition(selectedTransition.id, { from: event.target.value })}>{machine.states.map((state) => <option key={state.id}>{state.id}</option>)}</select></label>
                <label><span>TO</span><select value={selectedTransition.to} onChange={(event) => patchTransition(selectedTransition.id, { to: event.target.value })}>{machine.states.map((state) => <option key={state.id}>{state.id}</option>)}</select></label>
              </div>
              <div className="property-grid">
                <label><span>READ INPUT</span><input value={selectedTransition.input || 'ε'} onBlur={(event) => patchTransition(selectedTransition.id, { input: normalizeSymbol(event.target.value) })} onChange={(event) => patchTransition(selectedTransition.id, { input: event.target.value })} /></label>
                <label><span>STACK TOP</span><input value={selectedTransition.stackTop || 'ε'} onBlur={(event) => patchTransition(selectedTransition.id, { stackTop: normalizeSymbol(event.target.value) })} onChange={(event) => patchTransition(selectedTransition.id, { stackTop: event.target.value })} /></label>
                <label><span>REPLACE WITH</span><input value={selectedTransition.replacement} onBlur={(event) => patchTransition(selectedTransition.id, { replacement: normalizeSymbol(event.target.value) })} onChange={(event) => patchTransition(selectedTransition.id, { replacement: event.target.value })} /></label>
              </div>
              <div className="transition-preview"><small>READ · POP · PUSH</small><strong>{label(selectedTransition)}</strong></div>
              <button className="danger-button" onClick={deleteTransition}>Delete transition <kbd>Del</kbd></button>
            </div>
          ) : selectedState ? (
            <div className="state-properties">
              <div className="state-property-hero"><small>SELECTED STATE</small><strong>{selectedState.name}</strong><span>x {Math.round(selectedState.x)} · y {Math.round(selectedState.y)}</span></div>
              <div className="state-role-actions">
                <button className={selectedState.id === machine.startState ? 'selected-setting' : ''} onClick={setStart}><span className="setting-indicator" />{selectedState.id === machine.startState ? 'Start state' : 'Set as start'}</button>
                <button className={selectedState.accepting ? 'selected-setting' : ''} onClick={() => patchState(selectedState.id, { accepting: !selectedState.accepting })}><span className="setting-indicator" />{selectedState.accepting ? 'Accepting state' : 'Mark accepting'}</button>
              </div>
              <div className="nudge-controls" aria-label="Move selected state"><span>NUDGE POSITION</span><div><button aria-label="Move up" onClick={() => nudge(0, -GRID)}>↑</button><button aria-label="Move left" onClick={() => nudge(-GRID, 0)}>←</button><button aria-label="Move right" onClick={() => nudge(GRID, 0)}>→</button><button aria-label="Move down" onClick={() => nudge(0, GRID)}>↓</button></div><small>Arrow keys work anywhere outside an input.</small></div>
              <button className="danger-button" disabled={machine.states.length <= 1} onClick={deleteState}>Delete state <kbd>Del</kbd></button>
            </div>
          ) : <div className="property-empty"><b>Select an object</b><span>Choose a state or transition to edit its formal properties.</span></div>}

          <div className="designer-diagnostics">
            <div className="diagnostic-heading"><small>MACHINE DIAGNOSTICS</small><span>{diagnostics.length || '0'}</span></div>
            {diagnostics.length ? diagnostics.map((item, index) => <span key={`${item.message}-${index}`} className={item.level}><i />{item.message}</span>) : <span className="ok"><i />Machine structure is valid and ready to debug.</span>}
          </div>
        </aside>
      </div>
    </section>
  )
}
