import { useMemo, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { createState, createTransition, validatePDA } from '../core/pda/editor'
import type { PDA, PDAState, PDATransition } from '../core/pda/types'
import '../styles/pdaEditor.css'

interface PDAEditorProps {
  machine: PDA
  onChange: (machine: PDA) => void
  onBack: () => void
}

const WIDTH = 720
const HEIGHT = 430

function label(transition: PDATransition) {
  return `${transition.input || 'ε'}, ${transition.stackTop || 'ε'} → ${transition.replacement || 'ε'}`
}

function edgeGeometry(machine: PDA, transition: PDATransition, index: number) {
  const from = machine.states.find((state) => state.id === transition.from)
  const to = machine.states.find((state) => state.id === transition.to)
  if (!from || !to) return null

  if (from.id === to.id) {
    return {
      d: `M ${from.x - 22} ${from.y - 26} C ${from.x - 76} ${from.y - 92 - index * 3}, ${from.x + 76} ${from.y - 92 - index * 3}, ${from.x + 22} ${from.y - 26}`,
      x: from.x,
      y: from.y - 78 - index * 3,
    }
  }

  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.max(Math.hypot(dx, dy), 1)
  const ux = dx / length
  const uy = dy / length
  const bend = (index % 3 - 1) * 15
  const nx = -uy * bend
  const ny = ux * bend
  const sx = from.x + ux * 38
  const sy = from.y + uy * 38
  const ex = to.x - ux * 42
  const ey = to.y - uy * 42
  const mx = (sx + ex) / 2 + nx
  const my = (sy + ey) / 2 + ny
  return { d: `M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`, x: mx, y: my - 10 }
}

function normalizeSymbol(value: string) {
  return value.trim() || 'ε'
}

export function PDAEditor({ machine, onChange, onBack }: PDAEditorProps) {
  const [selectedStateId, setSelectedStateId] = useState(machine.startState)
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const selectedState = machine.states.find((state) => state.id === selectedStateId) || machine.states[0]
  const selectedTransition = machine.transitions.find((transition) => transition.id === selectedTransitionId)
  const diagnostics = useMemo(() => validatePDA(machine), [machine])

  const patchState = (id: string, patch: Partial<PDAState>) => {
    onChange({ ...machine, states: machine.states.map((state) => state.id === id ? { ...state, ...patch } : state) })
  }

  const patchTransition = (id: string, patch: Partial<PDATransition>) => {
    onChange({ ...machine, transitions: machine.transitions.map((transition) => transition.id === id ? { ...transition, ...patch } : transition) })
  }

  const addState = () => {
    const state = createState(machine, 130 + (machine.states.length * 110) % 470, 260 + (machine.states.length % 2) * 70)
    onChange({ ...machine, states: [...machine.states, state] })
    setSelectedStateId(state.id)
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
    const x = Math.min(WIDTH - 45, Math.max(45, ((event.clientX - rect.left) / rect.width) * WIDTH))
    const y = Math.min(HEIGHT - 45, Math.max(55, ((event.clientY - rect.top) / rect.height) * HEIGHT))
    patchState(stateId, { x: Math.round(x), y: Math.round(y) })
  }

  const nudge = (dx: number, dy: number) => {
    if (!selectedState) return
    patchState(selectedState.id, {
      x: Math.min(WIDTH - 45, Math.max(45, selectedState.x + dx)),
      y: Math.min(HEIGHT - 45, Math.max(55, selectedState.y + dy)),
    })
  }

  return (
    <section className="designer-workspace">
      <div className="designer-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div className="designer-title"><small>PDA DESIGNER</small><strong>Edit the machine, then debug it immediately</strong></div>
        <label className="bottom-symbol-control"><small>INITIAL STACK</small><input value={machine.initialStackSymbol} maxLength={1} onChange={(event) => onChange({ ...machine, initialStackSymbol: event.target.value || 'Z' })} /></label>
        <button className="debug-machine-button" onClick={onBack}>Debug machine →</button>
      </div>

      <div className="designer-grid">
        <aside className="panel machine-objects-panel">
          <div className="panel-heading"><div><span>MACHINE OBJECTS</span><span className="heading-separator">/</span><span>{machine.states.length} STATES</span></div></div>
          <div className="object-section-heading"><span>STATES</span><button onClick={addState}>+ State</button></div>
          <div className="state-object-list">
            {machine.states.map((state) => (
              <button key={state.id} className={selectedState?.id === state.id && !selectedTransition ? 'selected' : ''} onClick={() => { setSelectedStateId(state.id); setSelectedTransitionId(null) }}>
                <span className={`state-mini-dot ${state.accepting ? 'accepting' : ''}`} />
                <b>{state.name}</b>
                <small>{state.id === machine.startState ? 'START' : state.accepting ? 'FINAL' : 'STATE'}</small>
              </button>
            ))}
          </div>
          <div className="object-section-heading"><span>TRANSITIONS</span><button onClick={addTransition} disabled={!machine.states.length}>+ Edge</button></div>
          <div className="transition-object-list">
            {machine.transitions.map((transition) => (
              <button key={transition.id} className={selectedTransition?.id === transition.id ? 'selected' : ''} onClick={() => { setSelectedTransitionId(transition.id); setSelectedStateId(transition.from) }}>
                <b>{transition.from} → {transition.to}</b><small>{label(transition)}</small>
              </button>
            ))}
            {!machine.transitions.length && <span className="empty-object-list">No transitions yet.</span>}
          </div>
        </aside>

        <section className="panel designer-canvas-panel">
          <div className="panel-heading"><div><span>GRAPH CANVAS</span><span className="heading-separator">/</span><span>DRAG STATES</span></div><span>720 × 430 MODEL SPACE</span></div>
          <div className="designer-canvas">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-label="Editable PDA graph">
              <defs><marker id="editor-arrow" markerWidth="9" markerHeight="9" refX="8" refY="3.5" orient="auto"><path d="M0,0 L0,7 L8,3.5 z" /></marker></defs>
              {machine.transitions.map((transition, index) => {
                const geometry = edgeGeometry(machine, transition, index)
                if (!geometry) return null
                const selected = selectedTransition?.id === transition.id
                return (
                  <g key={transition.id} className={`designer-edge ${selected ? 'selected' : ''}`} onClick={() => { setSelectedTransitionId(transition.id); setSelectedStateId(transition.from) }}>
                    <path className="designer-edge-hit" d={geometry.d} />
                    <path className="designer-edge-line" d={geometry.d} markerEnd="url(#editor-arrow)" />
                    <g transform={`translate(${geometry.x} ${geometry.y})`}><rect x="-55" y="-10" width="110" height="20" rx="5" /><text textAnchor="middle" y="3">{label(transition)}</text></g>
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
                    <circle r="34" />
                    {state.accepting && <circle className="accepting-ring" r="27" />}
                    <text textAnchor="middle" y="4">{state.name}</text>
                    <text className="designer-state-role" textAnchor="middle" y="52">{state.id === machine.startState ? 'START' : state.accepting ? 'FINAL' : ''}</text>
                  </g>
                )
              })}
            </svg>
          </div>
        </section>

        <aside className="panel property-panel">
          <div className="panel-heading"><div><span>INSPECTOR</span><span className="heading-separator">/</span><span>{selectedTransition ? 'TRANSITION' : 'STATE'}</span></div></div>
          {selectedTransition ? (
            <div className="transition-properties">
              <label><span>FROM</span><select value={selectedTransition.from} onChange={(event) => patchTransition(selectedTransition.id, { from: event.target.value })}>{machine.states.map((state) => <option key={state.id}>{state.id}</option>)}</select></label>
              <label><span>TO</span><select value={selectedTransition.to} onChange={(event) => patchTransition(selectedTransition.id, { to: event.target.value })}>{machine.states.map((state) => <option key={state.id}>{state.id}</option>)}</select></label>
              <label><span>READ INPUT</span><input value={selectedTransition.input || 'ε'} onBlur={(event) => patchTransition(selectedTransition.id, { input: normalizeSymbol(event.target.value) })} onChange={(event) => patchTransition(selectedTransition.id, { input: event.target.value })} /></label>
              <label><span>STACK TOP</span><input value={selectedTransition.stackTop || 'ε'} onBlur={(event) => patchTransition(selectedTransition.id, { stackTop: normalizeSymbol(event.target.value) })} onChange={(event) => patchTransition(selectedTransition.id, { stackTop: event.target.value })} /></label>
              <label><span>REPLACE WITH</span><input value={selectedTransition.replacement} onBlur={(event) => patchTransition(selectedTransition.id, { replacement: normalizeSymbol(event.target.value) })} onChange={(event) => patchTransition(selectedTransition.id, { replacement: event.target.value })} /></label>
              <div className="transition-preview"><small>FORMAL EDGE</small><strong>{label(selectedTransition)}</strong></div>
              <button className="danger-button" onClick={deleteTransition}>Delete transition</button>
            </div>
          ) : selectedState ? (
            <div className="state-properties">
              <div className="state-property-hero"><small>SELECTED STATE</small><strong>{selectedState.name}</strong><span>x {Math.round(selectedState.x)} · y {Math.round(selectedState.y)}</span></div>
              <button className={selectedState.id === machine.startState ? 'selected-setting' : ''} onClick={setStart}>Set as start state</button>
              <button className={selectedState.accepting ? 'selected-setting' : ''} onClick={() => patchState(selectedState.id, { accepting: !selectedState.accepting })}>{selectedState.accepting ? '✓ Accepting state' : 'Mark accepting'}</button>
              <div className="nudge-controls" aria-label="Move selected state"><span>NUDGE POSITION</span><div><button onClick={() => nudge(0, -16)}>↑</button><button onClick={() => nudge(-16, 0)}>←</button><button onClick={() => nudge(16, 0)}>→</button><button onClick={() => nudge(0, 16)}>↓</button></div></div>
              <button className="danger-button" disabled={machine.states.length <= 1} onClick={deleteState}>Delete state</button>
            </div>
          ) : <div className="property-empty">Select a state or transition.</div>}

          <div className="designer-diagnostics">
            <small>MACHINE DIAGNOSTICS</small>
            {diagnostics.length ? diagnostics.map((item, index) => <span key={`${item.message}-${index}`} className={item.level}>{item.message}</span>) : <span className="ok">Machine structure is valid.</span>}
          </div>
        </aside>
      </div>
    </section>
  )
}
