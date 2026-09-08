import { useEffect, useMemo, useRef, useState } from 'react'
import type { PDA, PDATransition } from '../core/pda/types'
import { edgeChipWidth, layoutPDAEdges, transitionLabel, type PDAEdgeLayout } from './pdaEditorLayout'
import { machineAtSpringPositions, pointOnEdge, stepSpringMap, tangentOnEdge, type SpringMap } from './fluidGraphMotion'
import '../styles/fluidMachineGraph.css'

interface FluidMachineGraphProps {
  machine: PDA
  activeState: string
  activeTransitionId?: string | null
  animationKey?: string | number
  zoom?: number
}

type RendererMode = 'pixi-webgl' | 'canvas-2d'
type PixiRuntime = {
  Application: new () => any
  Graphics: new () => any
}

type LoopBundle = {
  stateId: string
  transitions: PDATransition[]
  representative: PDAEdgeLayout
  chipWidth: number
  chipHeight: number
  chipX: number
  chipY: number
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

function buildRenderModel(machine: PDA, edges = layoutPDAEdges(machine, WIDTH, HEIGHT)) {
  const transitionById = new Map(machine.transitions.map((transition) => [transition.id, transition]))
  const edgeByTransitionId = new Map(edges.map((edge) => [edge.transitionId, edge]))
  const regularEdges = edges.flatMap((edge) => {
    const transition = transitionById.get(edge.transitionId)
    if (!transition || transition.from === transition.to) return []
    return [{ edge, transition }]
  })

  const bundledLoops: LoopBundle[] = Array.from(groupSelfLoops(machine.transitions).entries()).flatMap(([stateId, transitions]) => {
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
    return [{ stateId, transitions, representative, chipWidth, chipHeight, chipX, chipY }]
  })

  return { regularEdges, bundledLoops }
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
    halo: read('--fluid-halo', '#4fd7ca'),
    pulse: read('--fluid-pulse', '#a7fff6'),
    initial: read('--fluid-initial', '#718198'),
  }
}

function edgeFocusAlpha(transition: PDATransition, activeTransition: PDATransition | undefined) {
  if (!activeTransition) return .72
  if (transition.id === activeTransition.id) return .98
  if (
    transition.from === activeTransition.from
    || transition.from === activeTransition.to
    || transition.to === activeTransition.from
    || transition.to === activeTransition.to
  ) return .42
  return .18
}

function stateFocusAlpha(stateId: string, activeState: string, activeTransition: PDATransition | undefined) {
  if (!activeTransition) return stateId === activeState ? 1 : .92
  if (stateId === activeState) return 1
  if (stateId === activeTransition.from || stateId === activeTransition.to) return .84
  return .48
}

function canvasTracePath(ctx: CanvasRenderingContext2D, edge: PDAEdgeLayout) {
  ctx.beginPath()
  ctx.moveTo(edge.start.x, edge.start.y)
  if (edge.kind === 'quadratic' && edge.control1) {
    ctx.quadraticCurveTo(edge.control1.x, edge.control1.y, edge.end.x, edge.end.y)
  } else if (edge.kind === 'loop' && edge.control1 && edge.control2) {
    ctx.bezierCurveTo(edge.control1.x, edge.control1.y, edge.control2.x, edge.control2.y, edge.end.x, edge.end.y)
  } else {
    ctx.lineTo(edge.end.x, edge.end.y)
  }
}

function canvasArrow(ctx: CanvasRenderingContext2D, edge: PDAEdgeLayout, color: string, alpha: number) {
  const point = pointOnEdge(edge, .985)
  const tangent = tangentOnEdge(edge, .985)
  const normal = { x: -tangent.y, y: tangent.x }
  const size = 7
  ctx.beginPath()
  ctx.moveTo(point.x + tangent.x * size, point.y + tangent.y * size)
  ctx.lineTo(point.x - tangent.x * size + normal.x * size * .62, point.y - tangent.y * size + normal.y * size * .62)
  ctx.lineTo(point.x - tangent.x * size - normal.x * size * .62, point.y - tangent.y * size - normal.y * size * .62)
  ctx.closePath()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fill()
  ctx.globalAlpha = 1
}

function pixiTracePath(graphics: any, edge: PDAEdgeLayout) {
  graphics.moveTo(edge.start.x, edge.start.y)
  if (edge.kind === 'quadratic' && edge.control1) {
    graphics.quadraticCurveTo(edge.control1.x, edge.control1.y, edge.end.x, edge.end.y)
  } else if (edge.kind === 'loop' && edge.control1 && edge.control2) {
    graphics.bezierCurveTo(edge.control1.x, edge.control1.y, edge.control2.x, edge.control2.y, edge.end.x, edge.end.y)
  } else {
    graphics.lineTo(edge.end.x, edge.end.y)
  }
}

function pixiArrow(graphics: any, edge: PDAEdgeLayout, color: string, alpha: number) {
  const point = pointOnEdge(edge, .985)
  const tangent = tangentOnEdge(edge, .985)
  const normal = { x: -tangent.y, y: tangent.x }
  const size = 7
  graphics.poly([
    point.x + tangent.x * size, point.y + tangent.y * size,
    point.x - tangent.x * size + normal.x * size * .62, point.y - tangent.y * size + normal.y * size * .62,
    point.x - tangent.x * size - normal.x * size * .62, point.y - tangent.y * size - normal.y * size * .62,
  ]).fill({ color, alpha })
}

function updateDomOverlay(viewport: HTMLElement, animatedMachine: PDA, model: ReturnType<typeof buildRenderModel>) {
  for (const { edge, transition } of model.regularEdges) {
    const label = viewport.querySelector<HTMLElement>(`[data-transition-id="${CSS.escape(transition.id)}"].fluid-edge-label`)
    if (!label) continue
    label.style.left = `${(edge.x / WIDTH) * 100}%`
    label.style.top = `${(edge.y / HEIGHT) * 100}%`
    label.style.width = `${(edge.width / WIDTH) * 100}%`
    label.dataset.edgePath = edge.d
    label.dataset.edgeKind = edge.kind
  }

  for (const bundle of model.bundledLoops) {
    const label = viewport.querySelector<HTMLElement>(`.fluid-loop-label[data-loop-state="${CSS.escape(bundle.stateId)}"]`)
    if (!label) continue
    label.style.left = `${(bundle.chipX / WIDTH) * 100}%`
    label.style.top = `${(bundle.chipY / HEIGHT) * 100}%`
    label.style.width = `${(bundle.chipWidth / WIDTH) * 100}%`
    label.dataset.edgePath = bundle.representative.d
  }

  for (const state of animatedMachine.states) {
    const copy = viewport.querySelector<HTMLElement>(`.fluid-state-copy[data-state-id="${CSS.escape(state.id)}"]`)
    if (!copy) continue
    copy.style.left = `${(state.x / WIDTH) * 100}%`
    copy.style.top = `${(state.y / HEIGHT) * 100}%`
  }
}

export function FluidMachineGraph({ machine, activeState, activeTransitionId, animationKey, zoom = 1 }: FluidMachineGraphProps) {
  const fallbackCanvasRef = useRef<HTMLCanvasElement>(null)
  const pixiHostRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const springsRef = useRef<SpringMap>(new Map())
  const hoverStateRef = useRef<string | null>(null)
  const pulseStartedAt = useRef(typeof performance === 'undefined' ? 0 : performance.now())
  const machineRef = useRef(machine)
  const activeStateRef = useRef(activeState)
  const activeTransitionIdRef = useRef(activeTransitionId)
  const zoomRef = useRef(zoom)
  const [rendererMode, setRendererMode] = useState<RendererMode>('canvas-2d')

  machineRef.current = machine
  activeStateRef.current = activeState
  activeTransitionIdRef.current = activeTransitionId
  zoomRef.current = zoom

  const staticModel = useMemo(() => buildRenderModel(machine), [machine])

  useEffect(() => {
    pulseStartedAt.current = performance.now()
  }, [activeTransitionId, animationKey])

  useEffect(() => {
    const viewport = viewportRef.current
    const canvas = fallbackCanvasRef.current
    const pixiHost = pixiHostRef.current
    if (!viewport || !canvas || !pixiHost || typeof window === 'undefined') return

    let disposed = false
    let frame = 0
    let previousNow = performance.now()
    let pixiApp: any = null
    let pixiGraphics: any = null
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const canvasContextAvailable = 'CanvasRenderingContext2D' in window
    const ctx = canvasContextAvailable ? canvas.getContext('2d') : null
    if (ctx) {
      canvas.width = Math.round(WIDTH * dpr)
      canvas.height = Math.round(HEIGHT * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const startPixi = async () => {
      if (disposed || pixiApp) return
      const runtime = (window as typeof window & { PIXI?: PixiRuntime }).PIXI
      if (!runtime?.Application || !runtime?.Graphics) return
      try {
        const app = new runtime.Application()
        await app.init({
          width: WIDTH,
          height: HEIGHT,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: dpr,
          preference: ['webgl'],
        })
        if (disposed) {
          app.destroy(true)
          return
        }
        const graphics = new runtime.Graphics()
        app.stage.addChild(graphics)
        pixiHost.replaceChildren(app.canvas)
        app.canvas.classList.add('fluid-pixi-canvas')
        pixiApp = app
        pixiGraphics = graphics
        setRendererMode('pixi-webgl')
      } catch {
        setRendererMode('canvas-2d')
      }
    }

    void startPixi()
    const runtimeScript = document.getElementById('pixi-runtime')
    runtimeScript?.addEventListener('load', startPixi)

    const pointerMove = (event: PointerEvent) => {
      const rect = viewport.getBoundingClientRect()
      const rawX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * WIDTH
      const rawY = ((event.clientY - rect.top) / Math.max(1, rect.height)) * HEIGHT
      const currentZoom = Math.max(.01, zoomRef.current)
      const x = (rawX - WIDTH / 2) / currentZoom + WIDTH / 2
      const y = (rawY - HEIGHT / 2) / currentZoom + HEIGHT / 2
      const animatedMachine = machineAtSpringPositions(machineRef.current, springsRef.current)
      const hovered = animatedMachine.states.find((state) => Math.hypot(state.x - x, state.y - y) <= 42)?.id ?? null
      hoverStateRef.current = hovered
      viewport.dataset.hoverState = hovered ?? ''
      viewport.style.cursor = hovered ? 'pointer' : ''
    }
    const pointerLeave = () => {
      hoverStateRef.current = null
      viewport.dataset.hoverState = ''
      viewport.style.cursor = ''
    }
    viewport.addEventListener('pointermove', pointerMove)
    viewport.addEventListener('pointerleave', pointerLeave)

    const draw = (now: number) => {
      if (disposed) return
      const deltaFrames = Math.max(.2, Math.min(2.4, (now - previousNow) / (1000 / 60)))
      previousNow = now
      const liveMachine = machineRef.current
      stepSpringMap(liveMachine, springsRef.current, deltaFrames, reducedMotion)
      const animatedMachine = machineAtSpringPositions(liveMachine, springsRef.current)
      const edges = layoutPDAEdges(animatedMachine, WIDTH, HEIGHT)
      const model = buildRenderModel(animatedMachine, edges)
      updateDomOverlay(viewport, animatedMachine, model)

      const transitionById = new Map(animatedMachine.transitions.map((transition) => [transition.id, transition]))
      const layoutById = new Map(edges.map((edge) => [edge.transitionId, edge]))
      const loopEdgeById = new Map<string, PDAEdgeLayout>()
      for (const bundle of model.bundledLoops) {
        for (const transition of bundle.transitions) loopEdgeById.set(transition.id, bundle.representative)
      }
      const activeTransition = activeTransitionIdRef.current ? transitionById.get(activeTransitionIdRef.current) : undefined
      const activeEdge = activeTransition ? layoutById.get(activeTransition.id) ?? loopEdgeById.get(activeTransition.id) : undefined
      const palette = readPalette(viewport)
      const breathing = reducedMotion ? 0 : (Math.sin(now / 360) + 1) / 2
      const elapsed = now - pulseStartedAt.current
      const progress = activeEdge && !reducedMotion ? Math.min(1, elapsed / 520) : 1
      const epsilonPulse = activeTransition ? !activeTransition.input || activeTransition.input === 'ε' : false

      if (pixiGraphics) {
        const g = pixiGraphics
        g.clear()

        const drawPixiPath = (edge: PDAEdgeLayout, transition: PDATransition, active: boolean) => {
          const alpha = edgeFocusAlpha(transition, activeTransition)
          if (active) {
            pixiTracePath(g, edge)
            g.stroke({ color: palette.activeEdge, width: 10, alpha: .11 })
          }
          pixiTracePath(g, edge)
          g.stroke({ color: active ? palette.activeEdge : palette.edge, width: active ? 2.8 : 1.65, alpha })
          pixiArrow(g, edge, active ? palette.activeEdge : palette.edge, alpha)
        }

        for (const { edge, transition } of model.regularEdges) drawPixiPath(edge, transition, transition.id === activeTransition?.id)
        for (const bundle of model.bundledLoops) {
          const activeLoop = bundle.transitions.find((transition) => transition.id === activeTransition?.id)
          const representativeTransition = activeLoop ?? bundle.transitions[0]
          if (representativeTransition) drawPixiPath(bundle.representative, representativeTransition, Boolean(activeLoop))
        }

        if (activeEdge && !reducedMotion) {
          for (let index = 8; index >= 0; index -= 1) {
            const t = Math.max(0, progress - index * .026)
            const point = pointOnEdge(activeEdge, t)
            const alpha = (1 - index / 9) * .34
            g.circle(point.x, point.y, 1.8 + (8 - index) * .16).fill({ color: palette.activeEdge, alpha })
          }
          const head = pointOnEdge(activeEdge, progress)
          if (epsilonPulse) {
            g.circle(head.x, head.y, 5.2).stroke({ color: palette.pulse, width: 2, alpha: .98 })
            g.circle(head.x, head.y, 9).stroke({ color: palette.activeEdge, width: 1, alpha: .25 })
          } else {
            g.circle(head.x, head.y, 4.4).fill({ color: palette.pulse, alpha: .98 })
          }
          if (progress > .72 && activeTransition) {
            const target = animatedMachine.states.find((state) => state.id === activeTransition.to)
            if (target) {
              const arrival = (progress - .72) / .28
              g.circle(target.x, target.y, 38 + arrival * 22).stroke({ color: palette.activeEdge, width: 1.5, alpha: Math.max(0, .38 * (1 - arrival)) })
            }
          }
        }

        for (const state of animatedMachine.states) {
          const active = state.id === activeStateRef.current
          const hovered = state.id === hoverStateRef.current
          const alpha = stateFocusAlpha(state.id, activeStateRef.current, activeTransition)
          if (state.initial) {
            g.moveTo(state.x - 68, state.y).lineTo(state.x - 43, state.y).stroke({ color: palette.initial, width: 1.7, alpha })
            g.poly([state.x - 40, state.y, state.x - 48, state.y - 5, state.x - 48, state.y + 5]).fill({ color: palette.initial, alpha })
          }
          if (active) {
            const pulseRadius = 45 + breathing * 7
            g.circle(state.x, state.y, 57).fill({ color: palette.activeEdge, alpha: .055 })
            g.circle(state.x, state.y, pulseRadius).stroke({ color: palette.activeEdge, width: 1.5, alpha: .34 })
          }
          if (hovered && !active) g.circle(state.x, state.y, 41).stroke({ color: palette.nodeStroke, width: 1.25, alpha: .42 })
          g.circle(state.x, state.y, 35).fill({ color: active ? palette.activeFill : palette.nodeFill, alpha }).stroke({ color: active ? palette.activeEdge : palette.nodeStroke, width: active ? 3 : 2, alpha })
          if (state.accepting) g.circle(state.x, state.y, 28).stroke({ color: palette.accepting, width: 1.8, alpha })
        }
      } else if (ctx) {
        ctx.clearRect(0, 0, WIDTH, HEIGHT)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        const drawCanvasPath = (edge: PDAEdgeLayout, transition: PDATransition, active: boolean) => {
          const alpha = edgeFocusAlpha(transition, activeTransition)
          if (active) {
            canvasTracePath(ctx, edge)
            ctx.strokeStyle = palette.activeEdge
            ctx.globalAlpha = .12
            ctx.lineWidth = 10
            ctx.stroke()
          }
          canvasTracePath(ctx, edge)
          ctx.strokeStyle = active ? palette.activeEdge : palette.edge
          ctx.globalAlpha = alpha
          ctx.lineWidth = active ? 2.8 : 1.65
          ctx.stroke()
          ctx.globalAlpha = 1
          canvasArrow(ctx, edge, active ? palette.activeEdge : palette.edge, alpha)
        }

        for (const { edge, transition } of model.regularEdges) drawCanvasPath(edge, transition, transition.id === activeTransition?.id)
        for (const bundle of model.bundledLoops) {
          const activeLoop = bundle.transitions.find((transition) => transition.id === activeTransition?.id)
          const representativeTransition = activeLoop ?? bundle.transitions[0]
          if (representativeTransition) drawCanvasPath(bundle.representative, representativeTransition, Boolean(activeLoop))
        }

        if (activeEdge && !reducedMotion) {
          for (let index = 8; index >= 0; index -= 1) {
            const t = Math.max(0, progress - index * .026)
            const point = pointOnEdge(activeEdge, t)
            ctx.beginPath()
            ctx.arc(point.x, point.y, 1.8 + (8 - index) * .16, 0, Math.PI * 2)
            ctx.fillStyle = palette.activeEdge
            ctx.globalAlpha = (1 - index / 9) * .34
            ctx.fill()
          }
          const head = pointOnEdge(activeEdge, progress)
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.arc(head.x, head.y, epsilonPulse ? 5.2 : 4.4, 0, Math.PI * 2)
          if (epsilonPulse) {
            ctx.strokeStyle = palette.pulse
            ctx.lineWidth = 2
            ctx.stroke()
          } else {
            ctx.fillStyle = palette.pulse
            ctx.fill()
          }
          if (progress > .72 && activeTransition) {
            const target = animatedMachine.states.find((state) => state.id === activeTransition.to)
            if (target) {
              const arrival = (progress - .72) / .28
              ctx.beginPath()
              ctx.arc(target.x, target.y, 38 + arrival * 22, 0, Math.PI * 2)
              ctx.strokeStyle = palette.activeEdge
              ctx.globalAlpha = Math.max(0, .38 * (1 - arrival))
              ctx.lineWidth = 1.5
              ctx.stroke()
            }
          }
          ctx.globalAlpha = 1
        }

        for (const state of animatedMachine.states) {
          const active = state.id === activeStateRef.current
          const hovered = state.id === hoverStateRef.current
          const alpha = stateFocusAlpha(state.id, activeStateRef.current, activeTransition)
          if (state.initial) {
            ctx.strokeStyle = palette.initial
            ctx.fillStyle = palette.initial
            ctx.globalAlpha = alpha
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
            ctx.arc(state.x, state.y, 57, 0, Math.PI * 2)
            ctx.fillStyle = palette.activeEdge
            ctx.globalAlpha = .055
            ctx.fill()
            ctx.beginPath()
            ctx.arc(state.x, state.y, 45 + breathing * 7, 0, Math.PI * 2)
            ctx.strokeStyle = palette.activeEdge
            ctx.globalAlpha = .34
            ctx.lineWidth = 1.5
            ctx.stroke()
          }
          if (hovered && !active) {
            ctx.beginPath()
            ctx.arc(state.x, state.y, 41, 0, Math.PI * 2)
            ctx.strokeStyle = palette.nodeStroke
            ctx.globalAlpha = .42
            ctx.lineWidth = 1.25
            ctx.stroke()
          }
          ctx.beginPath()
          ctx.arc(state.x, state.y, 35, 0, Math.PI * 2)
          ctx.fillStyle = active ? palette.activeFill : palette.nodeFill
          ctx.globalAlpha = alpha
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
          ctx.globalAlpha = 1
        }
      }

      frame = window.requestAnimationFrame(draw)
    }

    frame = window.requestAnimationFrame(draw)
    return () => {
      disposed = true
      window.cancelAnimationFrame(frame)
      runtimeScript?.removeEventListener('load', startPixi)
      viewport.removeEventListener('pointermove', pointerMove)
      viewport.removeEventListener('pointerleave', pointerLeave)
      if (pixiApp) pixiApp.destroy(true)
      pixiHost.replaceChildren()
    }
  }, [])

  return (
    <div
      ref={viewportRef}
      className="fluid-machine-viewport"
      data-renderer={rendererMode}
      role="img"
      aria-label="Animated PDA state diagram with spring motion and semantic transition pulses"
    >
      <div className="fluid-machine-scene" style={{ transform: `scale(${zoom})` }}>
        <div ref={pixiHostRef} className="fluid-pixi-host" aria-hidden="true" />
        <canvas ref={fallbackCanvasRef} className="fluid-machine-canvas" width={WIDTH} height={HEIGHT} aria-hidden="true" />

        <div className="fluid-graph-overlay" aria-hidden="true">
          {staticModel.regularEdges.map(({ edge, transition }) => (
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

          {staticModel.bundledLoops.map((bundle) => {
            const bundleActive = bundle.transitions.some((transition) => transition.id === activeTransitionId)
            return (
              <div
                key={`loop:${bundle.stateId}`}
                className={`fluid-loop-label ${bundleActive ? 'active' : ''}`}
                data-loop-state={bundle.stateId}
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

      <span className="fluid-renderer-badge" aria-hidden="true">{rendererMode === 'pixi-webgl' ? 'WEBGL' : 'CANVAS'}</span>
      <div className="fluid-graph-semantics">
        {machine.transitions.map((transition) => (
          <span key={transition.id}>{transition.from} to {transition.to}: {transitionLabel(transition)}</span>
        ))}
      </div>
    </div>
  )
}
