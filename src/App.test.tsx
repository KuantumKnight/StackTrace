// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { cfgToPda } from './core/cfg/cfgToPda'
import { parseGrammar } from './core/cfg/grammarParser'
import { saveWorkspace } from './core/workspace/persistence'

beforeEach(() => {
  cleanup()
  window.localStorage.clear()
  window.history.replaceState({}, '', '/')
})

describe('StackTrace app integration', () => {
  it('opens Learn and the verified Example Library', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Learn' }))
    expect(screen.getByText('GUIDED CONCEPT PATH')).toBeTruthy()
    expect(screen.getByText('PDA VS DFA')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Open examples/i }))
    expect(screen.getByText('BUILT-IN GOLDEN EXAMPLES')).toBeTruthy()
    expect(screen.getByText('Balanced Parentheses')).toBeTruthy()
    expect(screen.getByText('Even Palindromes')).toBeTruthy()
  })

  it('opens the authored PDA build workbench', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Build' }))
    expect(screen.getByText(/PDA WORKBENCH/)).toBeTruthy()
    expect(screen.getByText(/Shape the machine/)).toBeTruthy()
    expect(screen.getByRole('toolbar', { name: 'Canvas tools' })).toBeTruthy()
    expect(screen.getByLabelText('Initial stack symbol')).toBeTruthy()
    expect(screen.getByRole('button', { name: /Debug machine/i })).toBeTruthy()
  })

  it('accepts S -> (S)S | ε with input (()()) through the actual Step UI', () => {
    const grammar = 'S -> (S)S | ε'
    const machine = cfgToPda(parseGrammar(grammar)).machine
    saveWorkspace({ grammar, input: '(()())', acceptanceMode: 'final-state', machine, activeChallengeId: null })

    render(<App />)

    expect(document.querySelector('.machine-stage .fluid-machine-canvas')).toBeTruthy()
    for (let index = 0; index < 24 && !screen.queryByText('STRING ACCEPTED'); index += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Step →' }))
    }

    expect(screen.getByText('STRING ACCEPTED')).toBeTruthy()
    expect(screen.getByText('ACCEPTED')).toBeTruthy()
    expect(screen.getAllByText(/selected acceptance condition is satisfied/i).length).toBeGreaterThan(0)
  })

  it('keeps future configurations when moving Back and Forward', async () => {
    const user = userEvent.setup()
    render(<App />)

    const back = screen.getByRole('button', { name: /Back/i }) as HTMLButtonElement
    const forward = screen.getByRole('button', { name: /Forward/i }) as HTMLButtonElement
    expect(back.disabled).toBe(true)
    expect(forward.disabled).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Step →' }))
    expect(back.disabled).toBe(false)

    await user.click(back)
    expect(forward.disabled).toBe(false)

    await user.click(forward)
    expect(forward.disabled).toBe(true)
    expect(back.disabled).toBe(false)
  })

  it('distinguishes complete NPDA rejection from one dead branch', async () => {
    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByLabelText(/TEST STRING/i)
    await user.clear(input)
    await user.type(input, 'aabbb')
    await user.click(screen.getByRole('button', { name: /Load input/i }))

    const step = screen.getByRole('button', { name: 'Step →' })
    for (let index = 0; index < 7; index += 1) fireEvent.click(step)

    expect(screen.getByText('BRANCH TERMINATED')).toBeTruthy()
    expect(screen.getByText(/Rejected: every explored computation terminates/)).toBeTruthy()
    expect(screen.getByText('CLOSEST BRANCH')).toBeTruthy()
  })

  it('exposes all seven repair levels with the same fluid machine renderer', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Challenges' }))
    expect(screen.getByText('7 LEVELS')).toBeTruthy()
    expect(screen.getByText(/Bad Terminal Matcher/)).toBeTruthy()
    expect(document.querySelector('.challenge-machine-shell .fluid-machine-canvas')).toBeTruthy()
    expect(document.querySelector('.challenge-machine-shell svg')).toBeNull()
  })
})
