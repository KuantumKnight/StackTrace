import { describe, expect, it } from 'vitest'
import { runLanguageTests, type LanguageAssertion } from '../core/pda/testBench'
import { stackTraceExamples } from './examples'

function assertion(id: string, expectation: 'accept' | 'reject', input: string): LanguageAssertion {
  return { id, expectation, input, sourceLine: 0 }
}

describe('canonical StackTrace examples', () => {
  for (const example of stackTraceExamples) {
    it(`${example.id} matches its documented language samples`, () => {
      const assertions = [
        ...example.accepts.map((input, index) => assertion(`a-${index}`, 'accept', input)),
        ...example.rejects.map((input, index) => assertion(`r-${index}`, 'reject', input)),
      ]
      const results = runLanguageTests(example.machine, assertions, example.acceptanceMode, 50, 2500)
      expect(results.every((result) => result.passed), example.id).toBe(true)
    })
  }
})
