import type { PDA } from '../core/pda/types'
import type { PDAEdgeLayout, Point } from './pdaEditorLayout'

export interface SpringPoint extends Point {
  vx: number
  vy: number
}

export type SpringMap = Map<string, SpringPoint>

export function syncSpringMap(machine: PDA, springs: SpringMap) {
  const ids = new Set(machine.states.map((state) => state.id))
  for (const id of springs.keys()) {
    if (!ids.has(id)) springs.delete(id)
  }
  for (const state of machine.states) {
    if (!springs.has(state.id)) springs.set(state.id, { x: state.x, y: state.y, vx: 0, vy: 0 })
  }
}

export function stepSpringMap(machine: PDA, springs: SpringMap, deltaFrames: number, reducedMotion = false) {
  syncSpringMap(machine, springs)
  const frame = Math.min(2.4, Math.max(.2, deltaFrames))
  const stiffness = .12 * frame
  const damping = Math.pow(.74, frame)

  for (const target of machine.states) {
    const spring = springs.get(target.id)
    if (!spring) continue
    if (reducedMotion) {
      spring.x = target.x
      spring.y = target.y
      spring.vx = 0
      spring.vy = 0
      continue
    }

    spring.vx = (spring.vx + (target.x - spring.x) * stiffness) * damping
    spring.vy = (spring.vy + (target.y - spring.y) * stiffness) * damping
    spring.x += spring.vx * frame
    spring.y += spring.vy * frame

    if (Math.abs(target.x - spring.x) < .03 && Math.abs(spring.vx) < .03) {
      spring.x = target.x
      spring.vx = 0
    }
    if (Math.abs(target.y - spring.y) < .03 && Math.abs(spring.vy) < .03) {
      spring.y = target.y
      spring.vy = 0
    }
  }
}

export function machineAtSpringPositions(machine: PDA, springs: SpringMap): PDA {
  return {
    ...machine,
    states: machine.states.map((state) => {
      const spring = springs.get(state.id)
      return spring ? { ...state, x: spring.x, y: spring.y } : state
    }),
  }
}

function quadraticPoint(start: Point, control: Point, end: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
    y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
  }
}

function cubicPoint(start: Point, control1: Point, control2: Point, end: Point, t: number): Point {
  const u = 1 - t
  return {
    x: u ** 3 * start.x + 3 * u * u * t * control1.x + 3 * u * t * t * control2.x + t ** 3 * end.x,
    y: u ** 3 * start.y + 3 * u * u * t * control1.y + 3 * u * t * t * control2.y + t ** 3 * end.y,
  }
}

export function pointOnEdge(edge: PDAEdgeLayout, t: number) {
  if (edge.kind === 'quadratic' && edge.control1) return quadraticPoint(edge.start, edge.control1, edge.end, t)
  if (edge.kind === 'loop' && edge.control1 && edge.control2) return cubicPoint(edge.start, edge.control1, edge.control2, edge.end, t)
  return {
    x: edge.start.x + (edge.end.x - edge.start.x) * t,
    y: edge.start.y + (edge.end.y - edge.start.y) * t,
  }
}

export function tangentOnEdge(edge: PDAEdgeLayout, t: number) {
  const a = pointOnEdge(edge, Math.max(0, t - .01))
  const b = pointOnEdge(edge, Math.min(1, t + .01))
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.max(1, Math.hypot(dx, dy))
  return { x: dx / length, y: dy / length }
}
