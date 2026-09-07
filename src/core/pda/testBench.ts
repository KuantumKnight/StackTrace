import { buildExecutionTree } from './executionTree'
import type { AcceptanceMode, PDA } from './types'

export type TestExpectation = 'accept' | 'reject'
export type TestOutcome = 'accepted' | 'rejected' | 'limit'

export interface LanguageAssertion {
  id: string
  expectation: TestExpectation
  input: string
  sourceLine: number
}

export interface LanguageTestResult extends LanguageAssertion {
  outcome: TestOutcome
  passed: boolean
  configurations: number
  acceptingDepth?: number
  reason: string
}

export interface AssertionParseResult {
  assertions: LanguageAssertion[]
  errors: string[]
}

export function parseAssertions(source: string): AssertionParseResult {
  const assertions: LanguageAssertion[] = []
  const errors: string[] = []

  source.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) return

    const match = line.match(/^(accept|reject)\s+"([^"]*)"\s*$/i)
    if (!match) {
      errors.push(`Line ${index + 1}: expected accept "input" or reject "input".`)
      return
    }

    assertions.push({
      id: `test-${index + 1}`,
      expectation: match[1].toLowerCase() as TestExpectation,
      input: match[2] === 'ε' || match[2].toLowerCase() === 'epsilon' ? '' : match[2],
      sourceLine: index + 1,
    })
  })

  return { assertions, errors }
}

export function runLanguageTests(
  machine: PDA,
  assertions: LanguageAssertion[],
  mode: AcceptanceMode,
  maxDepth = 40,
  maxNodes = 1200,
): LanguageTestResult[] {
  return assertions.map((assertion) => {
    const tree = buildExecutionTree(machine, assertion.input, mode, maxDepth, maxNodes)
    const accepting = tree.nodes
      .filter((node) => node.config.status === 'accepted')
      .sort((a, b) => a.depth - b.depth)[0]

    const outcome: TestOutcome = accepting ? 'accepted' : tree.truncated ? 'limit' : 'rejected'
    const expectedOutcome = assertion.expectation === 'accept' ? 'accepted' : 'rejected'
    const passed = outcome === expectedOutcome

    return {
      ...assertion,
      outcome,
      passed,
      configurations: tree.nodes.length,
      acceptingDepth: accepting?.depth,
      reason: accepting
        ? `Accepting computation found at depth ${accepting.depth}.`
        : tree.truncated
          ? `Search reached its safety limit before proving rejection.`
          : `All ${tree.nodes.length} explored configurations terminated without acceptance.`,
    }
  })
}
