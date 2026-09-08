import { describe, expect, it } from 'vitest'
import type { PDA, PDATransition } from '../core/pda/types'
import { layoutPDAEdges } from './pdaEditorLayout'

function transition(id: string, from: string, to: string): PDATransition {
  return { id, from, to, input: 'a', stackTop: 'Z', replacement: 'AZ' }
}

function machine(states: PDA['states'], transitions: PDA['transitions']): PDA {
  return { states, transitions, startState: states[0].id, initialStackSymbol: 'Z' }
}

describe('PDA workbench edge layout', () => {
  it('moves a chip sideways when a 110px vertical edge leaves too little node clearance', () => {
    const graph = machine(
      [
        { id: 'q0', name: 'q0', x: 360, y: 150, initial: true },
        { id: 'q1', name: 'q1', x: 360, y: 260 },
      ],
      [transition('t0', 'q0', 'q1')],
    )

    const [edge] = layoutPDAEdges(graph)
    expect(edge.kind).toBe('line')
    expect(edge.curveMidpoint.x).toBeCloseTo(360)
    expect(Math.abs(edge.x - edge.curveMidpoint.x)).toBeGreaterThanOrEqual(18)
    expect(edge.y).toBeCloseTo(edge.curveMidpoint.y)
  })

  it('keeps the first edge straight and fans additional parallel edges per state pair', () => {
    const graph = machine(
      [
        { id: 'q0', name: 'q0', x: 160, y: 220, initial: true },
        { id: 'q1', name: 'q1', x: 560, y: 220 },
      ],
      [transition('t0', 'q0', 'q1'), transition('t1', 'q0', 'q1'), transition('t2', 'q0', 'q1')],
    )

    const edges = layoutPDAEdges(graph)
    expect(edges[0].kind).toBe('line')
    expect(edges[0].d).toContain(' L ')
    expect(edges[1].kind).toBe('quadratic')
    expect(edges[2].kind).toBe('quadratic')
    expect(edges[1].d).not.toBe(edges[2].d)
    expect(edges[1].curveMidpoint.y).toBeCloseTo(235)
    expect(edges[2].curveMidpoint.y).toBeCloseTo(205)
    expect(new Set(edges.map((edge) => `${edge.x.toFixed(2)}:${edge.y.toFixed(2)}`)).size).toBe(3)
  })

  it('places self-loop labels above the state without covering the node', () => {
    const graph = machine(
      [{ id: 'q0', name: 'q0', x: 360, y: 210, initial: true }],
      [transition('loop', 'q0', 'q0')],
    )

    const [edge] = layoutPDAEdges(graph)
    expect(edge.kind).toBe('loop')
    expect(edge.y).toBeLessThan(150)
    expect(edge.x - edge.width / 2).toBeGreaterThanOrEqual(10)
    expect(edge.x + edge.width / 2).toBeLessThanOrEqual(710)
  })

  it('clamps displaced chips inside the canvas near a border', () => {
    const graph = machine(
      [
        { id: 'q0', name: 'q0', x: 45, y: 70, initial: true },
        { id: 'q1', name: 'q1', x: 45, y: 180 },
      ],
      [transition('t0', 'q0', 'q1')],
    )

    const [edge] = layoutPDAEdges(graph)
    expect(edge.x - edge.width / 2).toBeGreaterThanOrEqual(10)
    expect(edge.x + edge.width / 2).toBeLessThanOrEqual(710)
    expect(edge.y - 12).toBeGreaterThanOrEqual(10)
    expect(edge.y + 12).toBeLessThanOrEqual(420)
  })

  it('anchors a collision-free straight-edge chip at the visible segment midpoint', () => {
    const graph = machine(
      [
        { id: 'q0', name: 'q0', x: 100, y: 220, initial: true },
        { id: 'q1', name: 'q1', x: 620, y: 220 },
      ],
      [transition('t0', 'q0', 'q1')],
    )

    const [edge] = layoutPDAEdges(graph)
    expect(edge.kind).toBe('line')
    expect(edge.curveMidpoint.x).toBeCloseTo(359)
    expect(edge.curveMidpoint.y).toBeCloseTo(220)
    expect(edge.x).toBeCloseTo(edge.curveMidpoint.x)
    expect(edge.y).toBeCloseTo(edge.curveMidpoint.y)
  })
})
