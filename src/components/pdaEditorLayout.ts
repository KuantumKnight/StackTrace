import type { PDA, PDATransition } from '../core/pda/types'

export const PDA_CANVAS_WIDTH = 720
export const PDA_CANVAS_HEIGHT = 430

const STATE_RADIUS = 34
const STATE_CLEARANCE = 12
const CHIP_HEIGHT = 24
const CHIP_GAP = 8
const CANVAS_MARGIN = 10
const PARALLEL_BEND = 30

type Point = { x: number; y: number }

type BaseEdgeLayout = {
  transitionId: string
  d: string
  curveMidpoint: Point
  normal: Point
  bend: number
  kind: 'line' | 'quadratic' | 'loop'
}

export interface PDAEdgeLayout extends BaseEdgeLayout {
  x: number
  y: number
  width: number
}

export function transitionLabel(transition: PDATransition) {
  return `${transition.input || 'ε'}, ${transition.stackTop || 'ε'} → ${transition.replacement || 'ε'}`
}

export function edgeChipWidth(text: string, canvasWidth = PDA_CANVAS_WIDTH) {
  return Math.min(canvasWidth - CANVAS_MARGIN * 2, Math.max(96, text.length * 6.9 + 18))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function quadraticPoint(start: Point, control: Point, end: Point, t: number): Point {
  const oneMinusT = 1 - t
  return {
    x: oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x,
    y: oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y,
  }
}

function cubicPoint(start: Point, control1: Point, control2: Point, end: Point, t: number): Point {
  const oneMinusT = 1 - t
  return {
    x: oneMinusT ** 3 * start.x
      + 3 * oneMinusT ** 2 * t * control1.x
      + 3 * oneMinusT * t * t * control2.x
      + t ** 3 * end.x,
    y: oneMinusT ** 3 * start.y
      + 3 * oneMinusT ** 2 * t * control1.y
      + 3 * oneMinusT * t * t * control2.y
      + t ** 3 * end.y,
  }
}

function pairKey(from: string, to: string) {
  return from < to ? `${from}\u0000${to}` : `${to}\u0000${from}`
}

function laneFor(pairIndex: number) {
  if (pairIndex === 0) return 0
  const rank = Math.ceil(pairIndex / 2)
  return pairIndex % 2 === 1 ? rank : -rank
}

function baseLayouts(machine: PDA): BaseEdgeLayout[] {
  const pairCounts = new Map<string, number>()
  const loopCounts = new Map<string, number>()

  return machine.transitions.flatMap((transition): BaseEdgeLayout[] => {
    const from = machine.states.find((state) => state.id === transition.from)
    const to = machine.states.find((state) => state.id === transition.to)
    if (!from || !to) return []

    if (from.id === to.id) {
      const loopIndex = loopCounts.get(from.id) ?? 0
      loopCounts.set(from.id, loopIndex + 1)
      const rise = 92 + loopIndex * 22
      const spread = 76 + loopIndex * 12
      const start = { x: from.x - 22, y: from.y - 26 }
      const control1 = { x: from.x - spread, y: from.y - rise }
      const control2 = { x: from.x + spread, y: from.y - rise }
      const end = { x: from.x + 22, y: from.y - 26 }
      const curveMidpoint = cubicPoint(start, control1, control2, end, 0.5)
      return [{
        transitionId: transition.id,
        d: `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`,
        curveMidpoint,
        normal: { x: 0, y: -1 },
        bend: rise,
        kind: 'loop',
      }]
    }

    const key = pairKey(from.id, to.id)
    const pairIndex = pairCounts.get(key) ?? 0
    pairCounts.set(key, pairIndex + 1)
    const lane = laneFor(pairIndex)

    const dx = to.x - from.x
    const dy = to.y - from.y
    const length = Math.max(Math.hypot(dx, dy), 1)
    const ux = dx / length
    const uy = dy / length
    const normal = { x: -uy, y: ux }
    const startInset = Math.min(38, length * 0.35)
    const endInset = Math.min(42, length * 0.35)
    const start = { x: from.x + ux * startInset, y: from.y + uy * startInset }
    const end = { x: to.x - ux * endInset, y: to.y - uy * endInset }

    if (lane === 0) {
      return [{
        transitionId: transition.id,
        d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        curveMidpoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
        normal,
        bend: 0,
        kind: 'line',
      }]
    }

    const bend = lane * PARALLEL_BEND
    const control = {
      x: (start.x + end.x) / 2 + normal.x * bend,
      y: (start.y + end.y) / 2 + normal.y * bend,
    }
    return [{
      transitionId: transition.id,
      d: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
      curveMidpoint: quadraticPoint(start, control, end, 0.5),
      normal,
      bend,
      kind: 'quadratic',
    }]
  })
}

function clampChip(point: Point, chipWidth: number, canvasWidth: number, canvasHeight: number): Point {
  const halfWidth = chipWidth / 2
  const halfHeight = CHIP_HEIGHT / 2
  return {
    x: clamp(point.x, CANVAS_MARGIN + halfWidth, canvasWidth - CANVAS_MARGIN - halfWidth),
    y: clamp(point.y, CANVAS_MARGIN + halfHeight, canvasHeight - CANVAS_MARGIN - halfHeight),
  }
}

function chipHitsState(point: Point, chipWidth: number, state: Point) {
  const halfWidth = chipWidth / 2
  const halfHeight = CHIP_HEIGHT / 2
  const nearestX = clamp(state.x, point.x - halfWidth, point.x + halfWidth)
  const nearestY = clamp(state.y, point.y - halfHeight, point.y + halfHeight)
  return Math.hypot(state.x - nearestX, state.y - nearestY) < STATE_RADIUS + STATE_CLEARANCE
}

function chipsOverlap(a: { x: number; y: number; width: number }, b: { x: number; y: number; width: number }) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 + CHIP_GAP
    && Math.abs(a.y - b.y) < CHIP_HEIGHT + CHIP_GAP
}

function availableDistance(point: Point, normal: Point, sign: number, chipWidth: number, canvasWidth: number, canvasHeight: number) {
  const halfWidth = chipWidth / 2 + CANVAS_MARGIN
  const halfHeight = CHIP_HEIGHT / 2 + CANVAS_MARGIN
  let distance = Number.POSITIVE_INFINITY
  const dx = normal.x * sign
  const dy = normal.y * sign

  if (dx > 0) distance = Math.min(distance, (canvasWidth - halfWidth - point.x) / dx)
  else if (dx < 0) distance = Math.min(distance, (halfWidth - point.x) / dx)
  if (dy > 0) distance = Math.min(distance, (canvasHeight - halfHeight - point.y) / dy)
  else if (dy < 0) distance = Math.min(distance, (halfHeight - point.y) / dy)

  return Number.isFinite(distance) ? Math.max(0, distance) : 0
}

function placeChip(
  base: BaseEdgeLayout,
  chipWidth: number,
  machine: PDA,
  placed: PDAEdgeLayout[],
  canvasWidth: number,
  canvasHeight: number,
) {
  const positiveSpace = availableDistance(base.curveMidpoint, base.normal, 1, chipWidth, canvasWidth, canvasHeight)
  const negativeSpace = availableDistance(base.curveMidpoint, base.normal, -1, chipWidth, canvasWidth, canvasHeight)
  const preferredSign = base.kind === 'loop'
    ? 1
    : base.bend !== 0
      ? Math.sign(base.bend)
      : positiveSpace >= negativeSpace ? 1 : -1

  const distances = [0, 18, 30, 42, 54, 66, 78, 90, 108, 126, 144, 168]
  const candidates: Point[] = []
  for (const distance of distances) {
    if (distance === 0) {
      candidates.push(base.curveMidpoint)
      continue
    }
    candidates.push({
      x: base.curveMidpoint.x + base.normal.x * distance * preferredSign,
      y: base.curveMidpoint.y + base.normal.y * distance * preferredSign,
    })
    candidates.push({
      x: base.curveMidpoint.x - base.normal.x * distance * preferredSign,
      y: base.curveMidpoint.y - base.normal.y * distance * preferredSign,
    })
  }

  const seen = new Set<string>()
  for (const candidate of candidates) {
    const point = clampChip(candidate, chipWidth, canvasWidth, canvasHeight)
    const key = `${point.x.toFixed(3)}:${point.y.toFixed(3)}`
    if (seen.has(key)) continue
    seen.add(key)

    const hitsNode = machine.states.some((state) => chipHitsState(point, chipWidth, state))
    const hitsChip = placed.some((other) => chipsOverlap({ ...point, width: chipWidth }, other))
    if (!hitsNode && !hitsChip) return point
  }

  return clampChip({
    x: base.curveMidpoint.x + base.normal.x * 168 * preferredSign,
    y: base.curveMidpoint.y + base.normal.y * 168 * preferredSign,
  }, chipWidth, canvasWidth, canvasHeight)
}

export function layoutPDAEdges(
  machine: PDA,
  canvasWidth = PDA_CANVAS_WIDTH,
  canvasHeight = PDA_CANVAS_HEIGHT,
): PDAEdgeLayout[] {
  const placed: PDAEdgeLayout[] = []

  for (const base of baseLayouts(machine)) {
    const transition = machine.transitions.find((item) => item.id === base.transitionId)
    if (!transition) continue
    const width = edgeChipWidth(transitionLabel(transition), canvasWidth)
    const point = placeChip(base, width, machine, placed, canvasWidth, canvasHeight)
    placed.push({ ...base, ...point, width })
  }

  return placed
}
