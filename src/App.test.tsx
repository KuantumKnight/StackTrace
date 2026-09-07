// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

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

  it('keeps future configurations when moving Back and Forward', async () => {
    const user = userEvent.setup()
    render(<App />)

    const back = screen.getByRole('button', { name: /Back/i }) as HTMLButtonElement
    const forward = screen.getByRole('button', { name: /Forward/i }) as HTMLButtonElement
    expect(back.disabled).toBe(true)
    expect(forward.disabled).toBe(true)

    await user.click(screen.getByRole('button', { name: /Step/ }))
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

    const step = screen.getByRole('button', { name: /Step/ })
    for (let index = 0; index < 7; index += 1) fireEvent.click(step)

    expect(screen.getByText('BRANCH TERMINATED')).toBeTruthy()
    expect(screen.getByText(/Rejected — every explored computation terminates/)).toBeTruthy()
    expect(screen.getByText('CLOSEST BRANCH')).toBeTruthy()
  })

  it('exposes all seven repair levels', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Challenges' }))
    expect(screen.getByText('7 LEVELS')).toBeTruthy()
    expect(screen.getByText(/Bad Terminal Matcher/)).toBeTruthy()
  })
})
