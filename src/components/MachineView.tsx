import { useMemo, useState } from 'react'
import type { PDA, PDATransition } from '../core/pda/types'

interface MachineViewProps {
  machine: PDA
  activeState: string
  activeTransitionId?: string | null
}

interface EdgeGeometry {
  transition: PDATransition
  d: string
  labelX: number
  labelY: number
}

function buildEdge(machine: PDA, transition: PDATransition, index: number): EdgeGeometry {
  const from = machine.states.find((state) => state.id === transition.from)!
  const to = machine.states.find((state) => state.id === transition.to)!
  const loop = from.id === to.id

  if (loop) {
    return {
      transition,
      d: `M ${from.x - 23} ${from.y - 26} C ${from.x - 82} ${from.y - 98}, ${from.x + 82} ${from.y - 98}, ${from.x + 23} ${from.y - 26}`,
      labelX: from.x,
      labelY: from.y - 88 - index * 2,
    }
  }

  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.max(Math.hypot(dx, dy), 1)
  const ux = dx / length
  const uy = dy / length
  const startX = from.x + ux * 38
  const startY = from.y + uy * 38
  const endX = to.x - ux * 42
  const endY = to.y - uy * 42
  const bend = index % 2 === 0 ? -8 : 8
  const normalX = -uy * bend
  const normalY = ux * bend
  const midX = (startX + endX) / 2 + normalX
  const midY = (startY + endY) / 2 + normalY

  return {
    transition,
    d: `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`,
    labelX: midX,
    labelY: midY - 12,
  }
}

function transitionLabel(transition: PDATransition) {
  return `${transition.input || 'ε'}, ${transition.stackTop || 'ε'} → ${transition.replacement || 'ε'}`
}

export function MachineView({ machine, activeState, activeTransitionId }: MachineViewProps) {
  const [zoom, setZoom] = useState(1)
  const edges = useMemo(() => machine.transitions.map((transition, index) => buildEdge(machine, transition, index)), [machine])
  const activeTransition = machine.transitions.find((transition) => transition.id === activeTransitionId)

  return (
    <section className="panel machine-panel">
      <div className="panel-heading machine-heading">
        <div><span>PDA</span><span className="heading-separator">/</span><span>STATE GRAPH</span></div>
        <div className="machine-tools" role="group" aria-label="Graph zoom controls">
          <button type="button" onClick={() => setZoom((value) => Math.max(.78, value - .12))} aria-label="Zoom out">−</button>
          <button type="button" className="zoom-readout" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
          <button type="button" onClick={() => setZoom((value) => Math.min(1.35, value + .12))} aria-label="Zoom in">+</button>
        </div>
      </div>

      <div className="machine-canvas" role="region" aria-label="PDA state graph" tabIndex={0}>
        <div className="graph-watermark">LIVE MACHINE</div>
        <svg viewBox="0 0 640 280" role="img" aria-label="Animated PDA state diagram">
          <defs>
            <marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L8,3.5 z" />
            </marker>
            <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <g className="machine-scene" style={{ transform: `translate(320px, 140px) scale(${zoom}) translate(-320px, -140px)` }}>
            {edges.map(({ transition, d, labelX, labelY }) => {
              const isActive = transition.id === activeTransitionId
              return (
                <g className={`transition-group ${isActive ? 'active' : ''}`} key={transition.id}>
                  <path className="edge-hit-area" d={d} />
                  <path className="edge" d={d} markerEnd="url(#arrow)" />
                  {isActive && <path className="edge-flow" d={d} />}
                  <g className="edge-label-chip" transform={`translate(${labelX} ${labelY})`}>
                    <rect x="-54" y="-11" width="108" height="22" rx="6" />
                    <text textAnchor="middle" dominantBaseline="middle">{transitionLabel(transition)}</text>
                  </g>
                </g>
              )
            })}

            {machine.states.map((state) => {
              const active = activeState === state.id
              return (
                <g className={`state-group ${active ? 'active' : ''}`} key={state.id} transform={`translate(${state.x} ${state.y})`}>
                  {state.initial && <path className="initial-arrow" d="M -68 0 L -43 0" markerEnd="url(#arrow)" />}
                  {active && <circle className="state-radar radar-two" r="50" />}
                  {active && <circle className="state-radar" r="44" />}
                  <circle className={`state ${active ? 'active' : ''}`} r="35" filter={active ? 'url(#nodeGlow)' : undefined} />
                  {state.accepting && <circle className="state-inner" r="28" />}
                  <text className="state-label" y="5" textAnchor="middle">{state.name}</text>
                  <text className="state-caption" y="57" textAnchor="middle">
                    {state.initial ? 'START' : state.accepting ? 'FINAL' : active ? 'CURRENT' : ''}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        <div className="graph-telemetry" aria-live="polite">
          <span className="live-dot" />
          <div>
            <small>ACTIVE TRANSITION</small>
            <strong>{activeTransition ? transitionLabel(activeTransition) : 'Waiting for step'}</strong>
          </div>
        </div>
      </div>
    </section>
  )
}
