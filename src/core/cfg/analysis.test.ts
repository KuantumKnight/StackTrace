import { describe, expect, it } from 'vitest'
import { analyzeGrammar, grammarToSource, removeDirectLeftRecursion } from './analysis'
import { findAmbiguityWitness } from './ambiguity'
import { grammarDiagnostics } from './diagnostics'
import { findLeftFactoringOpportunities, leftFactorGrammar } from './factoring'
import { parseGrammar } from './grammarParser'

describe('CFG static analysis', () => {
  it('computes FIRST, FOLLOW, and nullable variables', () => {
    const grammar = parseGrammar('S -> AB\nA -> a | ε\nB -> b')
    const analysis = analyzeGrammar(grammar)

    expect(analysis.first.S).toEqual(expect.arrayContaining(['a', 'b']))
    expect(analysis.first.A).toEqual(expect.arrayContaining(['a', 'ε']))
    expect(analysis.follow.S).toContain('$')
    expect(analysis.follow.A).toContain('b')
    expect(analysis.follow.B).toContain('$')
    expect(analysis.nullable).toContain('A')
  })

  it('detects and removes direct left recursion', () => {
    const grammar = parseGrammar('E -> E+T | T\nT -> i')
    const analysis = analyzeGrammar(grammar)
    expect(analysis.directLeftRecursive).toEqual(['E'])

    const transformed = removeDirectLeftRecursion(grammar)
    const source = grammarToSource(transformed)
    expect(source).not.toContain('E -> E')
    expect(analyzeGrammar(transformed).directLeftRecursive).toEqual([])
  })

  it('reports undefined, unreachable, and non-generating symbols', () => {
    const grammar = parseGrammar('S -> aA | X\nA -> a\nB -> B')
    const diagnostics = grammarDiagnostics(grammar)
    expect(diagnostics.some((item) => item.code === 'undefined-symbol' && item.symbol === 'X')).toBe(true)
    expect(diagnostics.some((item) => item.code === 'unreachable-symbol' && item.symbol === 'B')).toBe(true)
    expect(diagnostics.some((item) => item.code === 'non-generating-symbol' && item.symbol === 'B')).toBe(true)
  })

  it('detects and fully applies left factoring', () => {
    const grammar = parseGrammar('S -> abC | abD | aE | f\nC -> c\nD -> d\nE -> e')
    expect(findLeftFactoringOpportunities(grammar)[0]?.prefix).toBe('ab')
    const transformed = leftFactorGrammar(grammar)
    expect(findLeftFactoringOpportunities(transformed)).toEqual([])
    expect(grammarToSource(transformed)).toContain('S ->')
  })

  it('finds an ambiguity witness using leftmost derivations only', () => {
    const ambiguous = parseGrammar('S -> SS | a')
    const result = findAmbiguityWitness(ambiguous, 5, 10, 3000)
    expect(result.witness).not.toBeNull()
    expect(result.witness?.value).toBe('aaa')
    expect(result.witness?.derivationA).not.toEqual(result.witness?.derivationB)
  })

  it('does not report a witness for the bounded a^n b^n grammar search', () => {
    const grammar = parseGrammar('S -> aSb | ε')
    const result = findAmbiguityWitness(grammar, 6, 10, 1200)
    expect(result.witness).toBeNull()
  })
})
