// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { PDA } from '../core/pda/types'
import { MachineView } from './MachineView'

afterEach(() => cleanup())

function closeVerticalMachine(): PDA {
  return {
    startState: 'q0',
    initialStackSymbol: 'Z',
    states: [
      { id: 'q0', name: 'q0', initial: true, x: 320, y: 85 },
      { id: 'q1', name: 'q1', accepting: true, x: 320, y: 195 },
    ],
    transitions: [
      { id: 't0', from: 'q0', to: 'q1', input: 'a', stackTop: 'Z', replacement: 'AZ' },
    ],
  }
}

describe('MachineView fluid graph', () => {
  it('renders the machine on canvas instead of SVG', () => {
    const { container } = render(<MachineView machine={closeVerticalMachine()} activeState="q0" />)
    expect(container.querySelector('.fluid-machine-canvas')).toBeTruthy()
    expect(container.querySelector('svg')).toBeNull()
  })

  it('displaces a short vertical-edge label away from the state nodes', () => {
    const { container } = render(<MachineView machine={closeVerticalMachine()} activeState="q0" />)
    const chip = container.querySelector<HTMLElement>('.fluid-edge-label[data-transition-id="t0"]')

    expect(chip).toBeTruthy()
    expect(chip?.getAttribute('data-edge-path')).toContain(' L ')
    const leftPercent = Number((chip?.style.left ?? '0').replace('%', ''))
    expect(Math.abs(leftPercent - 50)).toBeGreaterThanOrEqual((18 / 640) * 100)
  })

  it('keeps the first pair edge straight and fans additional pair edges', () => {
    const machine = closeVerticalMachine()
    machine.states = [
      { id: 'q0', name: 'q0', initial: true, x: 130, y: 140 },
      { id: 'q1', name: 'q1', accepting: true, x: 510, y: 140 },
    ]
    machine.transitions = [
      { id: 't0', from: 'q0', to: 'q1', input: 'a', stackTop: 'Z', replacement: 'AZ' },
      { id: 't1', from: 'q0', to: 'q1', input: 'b', stackTop: 'Z', replacement: 'BZ' },
      { id: 't2', from: 'q0', to: 'q1', input: 'ε', stackTop: 'Z', replacement: 'Z' },
    ]

    const { container } = render(<MachineView machine={machine} activeState="q0" />)
    const labels = Array.from(container.querySelectorAll<HTMLElement>('.fluid-edge-label'))
    const paths = labels.map((label) => label.dataset.edgePath ?? '')

    expect(paths).toHaveLength(3)
    expect(paths[0]).toContain(' L ')
    expect(paths[1]).toContain(' Q ')
    expect(paths[2]).toContain(' Q ')
    expect(paths[1]).not.toBe(paths[2])
  })

  it('bundles repeated qWork self-loops into one visual loop with all rules visible', () => {
    const machine: PDA = {
      startState: 'qInit',
      initialStackSymbol: 'Z',
      states: [
        { id: 'qInit', name: 'qInit', initial: true, x: 100, y: 132 },
        { id: 'qWork', name: 'qWork', x: 320, y: 132 },
        { id: 'qAccept', name: 'qAccept', accepting: true, x: 550, y: 132 },
      ],
      transitions: [
        { id: 'start', from: 'qInit', to: 'qWork', input: 'ε', stackTop: 'Z', replacement: 'SZ' },
        { id: 'prod-0', from: 'qWork', to: 'qWork', input: 'ε', stackTop: 'S', replacement: '(S)S' },
        { id: 'prod-1', from: 'qWork', to: 'qWork', input: 'ε', stackTop: 'S', replacement: 'ε' },
        { id: 'terminal-open', from: 'qWork', to: 'qWork', input: '(', stackTop: '(', replacement: 'ε' },
        { id: 'terminal-close', from: 'qWork', to: 'qWork', input: ')', stackTop: ')', replacement: 'ε' },
        { id: 'accept', from: 'qWork', to: 'qAccept', input: 'ε', stackTop: 'Z', replacement: 'ε' },
      ],
    }

    const { container } = render(<MachineView machine={machine} activeState="qWork" activeTransitionId="prod-0" />)
    const bundle = container.querySelector('.fluid-loop-label')

    expect(bundle).toBeTruthy()
    expect(bundle?.getAttribute('data-loop-count')).toBe('4')
    expect(bundle?.querySelectorAll('[data-transition-id]')).toHaveLength(4)
    expect(container.querySelectorAll('[data-edge-kind="loop"]')).toHaveLength(1)
    expect(bundle?.classList.contains('active')).toBe(true)
  })
})
