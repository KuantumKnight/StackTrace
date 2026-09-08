import { useEffect, useMemo, useRef } from 'react'
import type { PDA, PDATransition } from '../core/pda/types'
import { edgeChipWidth, layoutPDAEdges, transitionLabel, type PDAEdgeLayout } from './pdaEditorLayout'
import '../styles/fluidMachineGraph.css'

interface FluidMachineGraphProps {
  machine: PDA
  activeState: string
  activeTransitionId?: string | null
  animationKey?: string | number
  zoom?: number
}

const WIDTH = 640
const HEIGHT = 280
const LOOP_ROWS_PER_COLUMN = 4
const LOOP_LINE_HEIGHT = 18
const LOOP_COLUMN_GAP = 10
const LOOP_PADDING_X = 10
const LOOP_PADDING_Y = 8

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

function quadraticPoint(start: { x: number; y: number }, control: { x: number; y: number }, end: { x: number; y: number }, t: number) {
  const u = 1 - t
  return {
    x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
    y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
  }
}

function cubicPoint(
  start: { x: number; y: number },
  control1: { x: number; y: number },
  control2: { x: number; y: number },
  end: { x: number; y: number },
  t: number,
) {
  const u = 1 - t
  return {
    x: u ** 3 * start.x + 3 * u * u * t * control1.x + 3 * u * t * t * control2.x + t ** 3 * end.x,
    y: u ** 3 * start.y + 3 * u * u * t * control1.y + 3 * u * t * t * control2.y + t ** 3 * end.y,
  }
}

function pointOnEdge(edge: PDAEdgeLayout, t: number) {
  if (edge.kind === 'quadratic' && edge.control1) return quadraticPoint(edge.start, edge.control1, edge.end, t)
  if (edge.kind === 'loop' && edge.control1 && edge.control2) return cubicPoint(edge.start, edge.control1, edge.control2, edge.end, t)
  return {
    x: edge.start.x + (edge.end.x - edge.start.x) * t,
    y: edge.start.y + (edge.end.y - edge.start.y) * t,
  }
}

function tangentOnEdge(edge: PDAEdgeLayout, t: number) {
  const a = pointOnEdge(edge, Math.max(0, t - .01))
  const b = pointOnEdge(edge, Math.min(1, t + .01))
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.max(1, Math.hypot(dx, dy))
  return { x: dx / length, y: dy / length }
}

function drawArrow(ctx: CanvasRenderingContext2D, edge: PDAEdgeLayout, color: string) {
  const point = pointOnEdge(edge, .985)
  const tangent = tangentOnEdge(edge, .985)
  const normal = { x: -tangent.y, y: tangent.x }
  const size = 7
  ctx.beginPath()
  ctx.moveTo(point.x + tangent.x * size, point.y + tangent.y * size)
  ctx.lineTo(point.x - tangent.x * size + normal.x * size * .62, point.y - tangent.y * size + normal.y * size * .62)
  ctx.lineTo(point.x - tangent.x * size - normal.x * size * .62, point.y - tangent.y * size - normal.y * size * .62)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function readPalette(element: HTMLElement) {
  const style = getComputedStyle(element)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    edge: read('--fluid-edge-color', '#718198'),
    activeEdge: read('--fluid-active-edge', '#4fd7ca'),
    nodeFill: read('--fluid-node-fill', '#111923'),
    nodeStroke: read('--fluid-node-stroke', '#7c9cff'),
    activeFill: read('--fluid-active-fill', '#16263a'),
    accepting: read('--fluid-accepting', '#4fd7ca'),
    halo: read('--fluid-halo', 'rgba(79,215,202,.35)'),
    pulse: read('--fluid-pulse', '#a7fff6'),
    initial: read('--fluid-initial', '#718198'),
  }
}

export function FluidMachineGraph({ machine, activeState, activeTransitionId, animationKey, zoom = 1 }: FluidMachineGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const pulseStartedAt = useRef(performance.now())

  const edges = useMemo(() => layoutPDAEdges(machine, WIDTH, HEIGHT), [machine])
  const renderModel = useMemo(() => {
    const transitionById = new Map(machine.transitions.map((transition) => [transition.id, transition]))
    const edgeByTransitionId = new Map(edges.map((edge) => [edge.transitionId, edge]))
    const regularEdges = edges.flatMap((edge) => {
      const transition = transitionById.get(edge.transitionId)
      if (!transition || transition.from === transition.to) return []
      return [{ edge, transition }]
    })

    const bundledLoops = Array.from(groupSelfLoops(machine.transitions).entries()).flatMap(([stateId, transitions]) => {
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
      const chipX = clamp(state.x, 10 + chipWidth / 2, WIDTH - 10 - chipWidth / 2)
      const chipY = clamp(state.y - 48 - chipHeight / 2, 10 + chipHeight / 2, HEIGHT - 10 - chipHeight / 2)
      return [{ stateId, transitions, representative, columns, chipWidth, chipHeight, chipX, chipY }]
    })

    return { regularEdges, bundledLoops }
  }, [edges, machine])

  useEffect(() => {
    pulseStartedAt.current = performance.now()
  }, [activeTransitionId, animationKey])

  useEffect(() => {
    const canvas = canvasRef.current
    const viewport = viewportRef.current
    if (!canvas || !viewport || typeof window === 'undefined' || !('CanvasRenderingContext2D' in window)) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let disposed = false
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(WIDTH * dpr)
    canvas.height = Math.round(HEIGHT * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const regularEdgeById = new Map(renderModel.regularEdges.map((item) => [item.transition.id, item.edge]))
    const loopEdgeById = new Map<string, PDAEdgeLayout>()
    for (const bundle of renderModel.bundledLoops) {
      for (const transition of bundle.transitions) loopEdgeById.set(transition.id, bundle.representative)
    }

    const draw = (now: number) => {
      if (disposed) return
      const palette = readPalette(viewport)
      ctx.clearRect(0, 0, WIDTH, HEIGHT)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const activeEdge = activeTransitionId
        ? regularEdgeById.get(activeTransitionId) ?? loopEdgeById.get(activeTransitionId)
        : undefined

      const drawPath = (edge: PDAEdgeLayout, active: boolean) => {
        const path = new Path2D(edge.d)
        if (active) {
          ctx.save()
          ctx.strokeStyle = palette.activeEdge
          ctx.globalAlpha = .16
          ctx.lineWidth = 8
          ctx.shadowColor = palette.activeEdge
          ctx.shadowBlur = 12
          ctx.stroke(path)
          ctx.restore()
        }
        ctx.strokeStyle = active ? palette.activeEdge : palette.edge
        ctx.globalAlpha = active ? .98 : .72
        ctx.lineWidth = active ? 2.8 : 1.65
        ctx.stroke(path)
        ctx.globalAlpha = 1
        drawArrow(ctx, edge, active ? palette.activeEdge : palette.edge)
      }

      for (const { edge, transition } of renderModel.regularEdges) drawPath(edge, transition.id === activeTransitionId)
      for (const bundle of renderModel.bundledLoops) {
        drawPath(bundle.representative, bundle.transitions.some((transition) => transition.id === activeTransitionId))
      }

      if (activeEdge && !reducedMotion) {
        const elapsed = now - pulseStartedAt.current
        const progress = Math.min(1, elapsed / 460)
        const head = pointOnEdge(activeEdge, progress)
        for (let index = 7; index >= 0; index -= 1) {
          const t = Math.max(0, progress - index * .028)
          const point = pointOnEdge(activeEdge, t)
          const alpha = (1 - index / 8) * .42
          ctx.beginPath()
          ctx.arc(point.x, point.y, 2.2 + (7 - index) * .18, 0, Math.PI * 2)
          ctx.fillStyle = palette.activeEdge
          ctx.globalAlpha = alpha
          ctx.fill()
        }
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(head.x, head.y, 4.2, 0, Math.PI * 2)
        ctx.shadowColor = palette.pulse
        ctx.shadowBlur = 13
        ctx.fillStyle = palette.pulse
        ctx.fill()
        ctx.shadowBlur = 0
      }

      const breathing = reducedMotion ? 0 : (Math.sin(now / 360) + 1) / 2
      for (const state of machine.states) {
        const active = state.id === activeState
        if (state.initial) {
          ctx.strokeStyle = palette.initial
          ctx.fillStyle = palette.initial
          ctx.lineWidth = 1.7
          ctx.beginPath()
          ctx.moveTo(state.x - 68, state.y)
          ctx.lineTo(state.x - 43, state.y)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(state.x - 40, state.y)
          ctx.lineTo(state.x - 48, state.y - 5)
          ctx.lineTo(state.x - 48, state.y + 5)
          ctx.closePath()
          ctx.fill()
        }

        if (active) {
          ctx.beginPath()
          ctx.arc(state.x, state.y, 43 + breathing * 7, 0, Math.PI * 2)
          ctx.strokeStyle = palette.halo
          ctx.globalAlpha = .48 - breathing * .12
          ctx.lineWidth = 1.5
          ctx.setLineDash([5, 8])
          ctx.stroke()
          ctx.setLineDash([])
          ctx.globalAlpha = 1

          const radial = ctx.createRadialGradient(state.x, state.y, 28, state.x, state.y, 57)
          radial.addColorStop(0, palette.halo)
          radial.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = radial
          ctx.globalAlpha = .45
          ctx.beginPath()
          ctx.arc(state.x, state.y, 57, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }

        ctx.beginPath()
        ctx.arc(state.x, state.y, 35, 0, Math.PI * 2)
        ctx.fillStyle = active ? palette.activeFill : palette.nodeFill
        ctx.fill()
        ctx.strokeStyle = active ? palette.activeEdge : palette.nodeStroke
        ctx.lineWidth = active ? 3 : 2
        ctx.stroke()

        if (state.accepting) {
          ctx.beginPath()
          ctx.arc(state.x, state.y, 28, 0, Math.PI * 2)
          ctx.strokeStyle = palette.accepting
          ctx.lineWidth = 1.8
          ctx.stroke()
        }
      }

      frame = window.requestAnimationFrame(draw)
    }

    draw(performance.now())
    return () => {
      disposed = true
      window.cancelAnimationFrame(frame)
    }
  }, [machine, activeState, activeTransitionId, animationKey, renderModel])

  return (
    <div ref={viewportRef} className="fluid-machine-viewport" role="img" aria-label="Animated PDA state diagram rendered on a fluid canvas">
      <div className="fluid-machine-scene" style={{ transform: `scale(${zoom})` }}>
        <canvas ref={canvasRef} className="fluid-machine-canvas" width={WIDTH} height={HEIGHT} aria-hidden="true" />

        <div className="fluid-graph-overlay" aria-hidden="true">
          {renderModel.regularEdges.map(({ edge, transition }) => (
            <div
              key={transition.id}
              className={`fluid-edge-label ${transition.id === activeTransitionId ? 'active' : ''}`}
              data-transition-id={transition.id}
              data-edge-kind={edge.kind}
              data-edge-path={edge.d}
              style={{
                left: `${(edge.x / WIDTH) * 100}%`,
                top: `${(edge.y / HEIGHT) * 100}%`,
                width: `${(edge.width / WIDTH) * 100}%`,
              }}
            >
              {transitionLabel(transition)}
            </div>
          ))}

          {renderModel.bundledLoops.map((bundle) => {
            const bundleActive = bundle.transitions.some((transition) => transition.id === activeTransitionId)
            return (
              <div
                key={`loop:${bundle.stateId}`}
                className={`fluid-loop-label ${bundleActive ? 'active' : ''}`}
                data-loop-count={bundle.transitions.length}
                data-edge-kind="loop"
                data-edge-path={bundle.representative.d}
                style={{
                  left: `${(bundle.chipX / WIDTH) * 100}%`,
                  top: `${(bundle.chipY / HEIGHT) * 100}%`,
                  width: `${(bundle.chipWidth / WIDTH) * 100}%`,
                }}
              >
                {bundle.transitions.map((transition) => (
                  <span key={transition.id} data-transition-id={transition.id} className={transition.id === activeTransitionId ? 'active' : ''}>
                    {transitionLabel(transition)}
                  </span>
                ))}
              </div>
            )
          })}

          {machine.states.map((state) => (
            <div
              key={state.id}
              className={`fluid-state-copy ${state.id === activeState ? 'active' : ''}`}
              data-state-id={state.id}
              style={{ left: `${(state.x / WIDTH) * 100}%`, top: `${(state.y / HEIGHT) * 100}%` }}
            >
              <strong>{state.name}</strong>
              <small>{state.initial ? 'START' : state.accepting ? 'FINAL' : state.id === activeState ? 'CURRENT' : ''}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="fluid-graph-semantics">
        {machine.transitions.map((transition) => (
          <span key={transition.id}>{transition.from} to {transition.to}: {transitionLabel(transition)}</span>
        ))}
      </div>
    </div>
  )
}
