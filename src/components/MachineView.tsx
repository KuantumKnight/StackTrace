import { useMemo, useState } from 'react'
import type { PDA } from '../core/pda/types'
import { layoutPDAEdges, transitionLabel } from './pdaEditorLayout'

interface MachineViewProps {
  machine: PDA
  activeState: string
  activeTransitionId?: string | null
}

const WIDTH = 640
const HEIGHT = 280
const radarStyle = { transformBox: 'fill-box', transformOrigin: 'center' } as const

export function MachineView({ machine, activeState, activeTransitionId }: MachineViewProps) {
  const [zoom, setZoom] = useState(1)
  const edges = useMemo(
    () => layoutPDAEdges(machine, WIDTH, HEIGHT),
    [machine],
  )
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
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Animated PDA state diagram">
          <defs>
            <marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="3.5" orient="auto">
              <path d="M0,0 L0,7 L8,3.5 z" />
            </marker>
            <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <g className="machine-scene" style={{ transform: `translate(${WIDTH / 2}px, ${HEIGHT / 2}px) scale(${zoom}) translate(${-WIDTH / 2}px, ${-HEIGHT / 2}px)` }}>
            {edges.map((edge) => {
              const transition = machine.transitions.find((item) => item.id === edge.transitionId)
              if (!transition) return null
              const isActive = transition.id === activeTransitionId
              return (
                <g className={`transition-group ${isActive ? 'active' : ''}`} key={transition.id}>
                  <path className="edge-hit-area" d={edge.d} />
                  <path className="edge" d={edge.d} markerEnd="url(#arrow)" />
                  {isActive && <path className="edge-flow" d={edge.d} />}
                  <g className="edge-label-chip" transform={`translate(${edge.x} ${edge.y})`}>
                    <rect x={-edge.width / 2} y="-11" width={edge.width} height="22" rx="6" />
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
                  {active && <circle className="state-radar radar-two" r="50" style={radarStyle} />}
                  {active && <circle className="state-radar" r="44" style={radarStyle} />}
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
