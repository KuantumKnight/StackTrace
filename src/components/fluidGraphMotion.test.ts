import { describe, expect, it } from 'vitest'
import type { PDA } from '../core/pda/types'
import { machineAtSpringPositions, stepSpringMap, type SpringMap } from './fluidGraphMotion'

function machine(x: number, y: number): PDA {
  return {
    startState: 'q0',
    initialStackSymbol: 'Z',
    states: [{ id: 'q0', name: 'q0', initial: true, x, y }],
    transitions: [],
  }
}

describe('fluid graph spring motion', () => {
  it('moves toward a changed node position without teleporting', () => {
    const springs: SpringMap = new Map()
    stepSpringMap(machine(100, 100), springs, 1)
    const movedMachine = machine(300, 180)
    stepSpringMap(movedMachine, springs, 1)
    const animated = machineAtSpringPositions(movedMachine, springs)

    expect(animated.states[0].x).toBeGreaterThan(100)
    expect(animated.states[0].x).toBeLessThan(300)
    expect(animated.states[0].y).toBeGreaterThan(100)
    expect(animated.states[0].y).toBeLessThan(180)
  })

  it('converges to the target over repeated frames', () => {
    const springs: SpringMap = new Map()
    stepSpringMap(machine(100, 100), springs, 1)
    const target = machine(300, 180)
    for (let index = 0; index < 180; index += 1) stepSpringMap(target, springs, 1)
    const animated = machineAtSpringPositions(target, springs)

    expect(animated.states[0].x).toBeCloseTo(300, 1)
    expect(animated.states[0].y).toBeCloseTo(180, 1)
  })

  it('snaps immediately when reduced motion is requested', () => {
    const springs: SpringMap = new Map()
    stepSpringMap(machine(100, 100), springs, 1)
    const target = machine(300, 180)
    stepSpringMap(target, springs, 1, true)
    const animated = machineAtSpringPositions(target, springs)

    expect(animated.states[0].x).toBe(300)
    expect(animated.states[0].y).toBe(180)
  })
})
