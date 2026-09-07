import { describe, expect, it } from 'vitest'
import { analyzeGrammar, grammarToSource, removeDirectLeftRecursion } from './analysis'
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
})
