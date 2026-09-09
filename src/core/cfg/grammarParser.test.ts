import { describe, expect, it } from 'vitest'
import { deriveTarget } from './derivation'
import { parseGrammar } from './grammarParser'

describe('CFG parser and derivation search', () => {
  it('normalizes alternatives and discovers symbols', () => {
    const grammar = parseGrammar('S -> aSb | ε')
    expect(grammar.startSymbol).toBe('S')
    expect(grammar.nonTerminals).toEqual(['S'])
    expect(grammar.terminals.sort()).toEqual(['a', 'b'])
    expect(grammar.productions[0].right).toEqual(['aSb', 'ε'])
  })

  it('rejects malformed productions', () => {
    expect(() => parseGrammar('S aSb')).toThrow(/Invalid production/)
  })

  it('finds a bounded leftmost derivation for a^n b^n', () => {
    const grammar = parseGrammar('S -> aSb | ε')
    const result = deriveTarget(grammar, 'aaabbb', 'leftmost')
    expect(result.status).toBe('found')
    expect(result.forms).toEqual(['S', 'aSb', 'aaSbb', 'aaaSbbb', 'aaabbb'])
  })

  it('finds the same target with rightmost derivation', () => {
    const grammar = parseGrammar('S -> aSb | ε')
    const result = deriveTarget(grammar, 'aabb', 'rightmost')
    expect(result.status).toBe('found')
    expect(result.forms.at(-1)).toBe('aabb')
  })

  it('does not discard valid derivations with temporarily long sentential forms', () => {
    const grammar = parseGrammar('S -> A\nA -> BBBBBBBB\nB -> a | ε')
    const result = deriveTarget(grammar, 'a', 'leftmost')
    expect(result.status).toBe('found')
    expect(result.forms.at(-1)).toBe('a')
  })
})
