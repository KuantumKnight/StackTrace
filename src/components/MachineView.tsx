import { useMemo, useState } from 'react'
import type { PDA, PDATransition } from '../core/pda/types'
import { edgeChipWidth, layoutPDAEdges, transitionLabel } from './pdaEditorLayout'

interface MachineViewProps {
  machine: PDA
  activeState: string
  activeTransitionId?: string | null
}

const WIDTH = 640
const HEIGHT = 280
const LOOP_ROWS_PER_COLUMN = 4
const LOOP_LINE_HEIGHT = 18
const LOOP_COLUMN_GAP = 10
const LOOP_PADDING_X = 10
const LOOP_PADDING_Y = 8
const radarStyle = { transformBox: 'fill-box', transformOrigin: 'center' } as const

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function groupSelfLoops(transitions: PDATransition[]) {
  const groups = new Map<string, PDATransition[]>()
  for (const transition of transitions) {
    if (transition.from !== transition.to) continue
    const group = groups.get(transition.from) ?? []
    group.push(transition)
    groups.set(transition.from, group)
  }
  return groups
}

export function MachineView({ machine, activeState, activeTransitionId }: MachineViewProps) {
  const [zoom, setZoom] = useState(1)
  const edges = useMemo(
    () => layoutPDAEdges(machine, WIDTH, HEIGHT),
    [machine],
  )
  const activeTransition = machine.transitions.find((transition) => transition.id === activeTransitionId)

  const renderModel = useMemo(() => {
    const transitionById = new Map(machine.transitions.map((transition) => [transition.id, transition]))
    const edgeByTransitionId = new Map(edges.map((edge) => [edge.transitionId, edge]))
    const loopGroups = groupSelfLoops(machine.transitions)

    const regularEdges = edges.flatMap((edge) => {
      const transition = transitionById.get(edge.transitionId)
      if (!transition || transition.from === transition.to) return []
      return [{ edge, transition }]
    })

    const bundledLoops = Array.from(loopGroups.entries()).flatMap(([stateId, transitions]) => {
      const state = machine.states.find((item) => item.id === stateId)
      const representative = edgeByTransitionId.get(transitions[0]?.id ?? '')
      if (!state || !representative || !transitions.length) return []

      const columnCount = Math.max(1, Math.ceil(transitions.length / LOOP_ROWS_PER_COLUMN))
      const rowCount = Math.ceil(transitions.length / columnCount)
      const columns = Array.from({ length: columnCount }, (_, columnIndex) => {
        const start = columnIndex * rowCount
        const items = transitions.slice(start, start + rowCount)
        const width = Math.max(...items.map((transition) => edgeChipWidth(transitionLabel(transition), WIDTH)))
        return { items, width }
      }).filter((column) => column.items.length)

      const chipWidth = Math.min(
        WIDTH - 20,
        columns.reduce((sum, column) => sum + column.width, 0)
          + Math.max(0, columns.length - 1) * LOOP_COLUMN_GAP
          + LOOP_PADDING_X * 2,
      )
      const chipHeight = rowCount * LOOP_LINE_HEIGHT + LOOP_PADDING_Y * 2
      const nodeClearance = 48
      const chipX = clamp(state.x, 10 + chipWidth / 2, WIDTH - 10 - chipWidth / 2)
      const chipY = clamp(
        state.y - nodeClearance - chipHeight / 2,
        10 + chipHeight / 2,
        HEIGHT - 10 - chipHeight / 2,
      )

      return [{ stateId, state, transitions, representative, columns, chipWidth, chipHeight, chipX, chipY }]
    })

    return { regularEdges, bundledLoops }
  }, [edges, machine])

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
            {renderModel.regularEdges.map(({ edge, transition }) => {
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

            {renderModel.bundledLoops.map((bundle) => {
              const bundleActive = bundle.transitions.some((transition) => transition.id === activeTransitionId)
              let columnX = -bundle.chipWidth / 2 + LOOP_PADDING_X
              return (
                <g
                  className={`transition-group loop-bundle ${bundleActive ? 'active' : ''}`}
                  key={`loop:${bundle.stateId}`}
                  data-loop-count={bundle.transitions.length}
                >
                  <path className="edge-hit-area" d={bundle.representative.d} />
                  <path className="edge" d={bundle.representative.d} markerEnd="url(#arrow)" />
                  {bundleActive && <path className="edge-flow" d={bundle.representative.d} />}
                  <g className="edge-label-chip loop-label-stack" transform={`translate(${bundle.chipX} ${bundle.chipY})`}>
                    <rect
                      x={-bundle.chipWidth / 2}
                      y={-bundle.chipHeight / 2}
                      width={bundle.chipWidth}
                      height={bundle.chipHeight}
                      rx="8"
                    />
                    {bundle.columns.map((column, columnIndex) => {
                      const centerX = columnX + column.width / 2
                      columnX += column.width + LOOP_COLUMN_GAP
                      return column.items.map((transition, rowIndex) => {
                        const active = transition.id === activeTransitionId
                        const y = -bundle.chipHeight / 2 + LOOP_PADDING_Y + LOOP_LINE_HEIGHT / 2 + rowIndex * LOOP_LINE_HEIGHT
                        return (
                          <text
                            key={transition.id}
                            x={centerX}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontWeight={active ? 800 : 600}
                            opacity={bundleActive && !active ? .58 : 1}
                          >
                            {transitionLabel(transition)}
                          </text>
                        )
                      })
                    })}
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
