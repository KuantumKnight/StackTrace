import { describe, expect, it } from 'vitest'
import { cfgToPda } from './cfgToPda'
import { deriveTarget } from './derivation'
import { parseGrammar } from './grammarParser'
import { buildExecutionTree } from '../pda/executionTree'
import { initialConfiguration, nextConfigurations } from '../pda/simulator'
import type { PDA } from '../pda/types'

function generatedMachine(source: string): PDA {
  return cfgToPda(parseGrammar(source)).machine
}

function accepts(machine: PDA, input: string, maxDepth = 56, maxNodes = 4000) {
  const tree = buildExecutionTree(machine, input, 'final-state', maxDepth, maxNodes, 96)
  return tree.nodes.some((node) => node.config.status === 'accepted')
}

describe('real classroom CFG payloads', () => {
  it('parses punctuation terminals in the balanced-parentheses grammar', () => {
    const grammar = parseGrammar('S -> (S)S | ε')
    expect(grammar.terminals.sort()).toEqual(['(', ')'])
    expect(grammar.productions[0].right).toEqual(['(S)S', 'ε'])
  })

  it('normalizes spaced productions and common epsilon spellings', () => {
    expect(parseGrammar('S -> ( S ) S | ε').productions[0].right).toEqual(['(S)S', 'ε'])
    expect(parseGrammar('S -> a S b | lambda').productions[0].right).toEqual(['aSb', 'ε'])
    expect(parseGrammar('S -> a S b | epsilon').productions[0].right).toEqual(['aSb', 'ε'])
    expect(parseGrammar('S -> a S b | eps').productions[0].right).toEqual(['aSb', 'ε'])
    expect(parseGrammar('S -> a S b | λ').productions[0].right).toEqual(['aSb', 'ε'])
  })

  it('finds the exact derivation S =>* (()())', () => {
    const grammar = parseGrammar('S -> (S)S | ε')
    const result = deriveTarget(grammar, '(()())', 'leftmost')
    expect(result.status).toBe('found')
    expect(result.forms.at(-1)).toBe('(()())')
  })

  it('generated balanced-parentheses PDA accepts and rejects representative payloads', () => {
    const machine = generatedMachine('S -> (S)S | ε')
    for (const input of ['', '()', '(())', '()()', '(()())', '((()))']) {
      expect(accepts(machine, input), `expected accept: ${input || 'ε'}`).toBe(true)
    }
    for (const input of ['(', ')', '(()', '())', '())(', '(()))', ')(']) {
      expect(accepts(machine, input), `expected reject: ${input}`).toBe(false)
    }
  })

  it('spaced balanced-parentheses grammar generates the same language', () => {
    const machine = generatedMachine('S -> ( S ) S | ε')
    expect(accepts(machine, '(()())')).toBe(true)
    expect(accepts(machine, '())')).toBe(false)
  })

  it('linear Step/Run ordering follows an accepting NPDA witness', () => {
    const machine = generatedMachine('S -> (S)S | ε')
    let config = initialConfiguration(machine, '(()())', 'final-state')

    for (let step = 0; step < 24 && config.status !== 'accepted'; step += 1) {
      config = nextConfigurations(machine, config, 'final-state', step * 10)[0]
    }

    expect(config.status).toBe('accepted')
    expect(config.inputIndex).toBe(6)
  })

  it('generated a^n b^n PDA handles valid and invalid strings', () => {
    const machine = generatedMachine('S -> aSb | ε')
    for (const input of ['', 'ab', 'aabb', 'aaabbb']) expect(accepts(machine, input), input || 'ε').toBe(true)
    for (const input of ['a', 'abb', 'aab', 'abab', 'ba']) expect(accepts(machine, input), input).toBe(false)
  })

  it('generated even-palindrome PDA handles nondeterministic midpoint choices', () => {
    const machine = generatedMachine('S -> aSa | bSb | ε')
    for (const input of ['', 'aa', 'bb', 'abba', 'baab', 'aabbaa']) expect(accepts(machine, input), input || 'ε').toBe(true)
    for (const input of ['a', 'ab', 'aba', 'aabb', 'abbaba']) expect(accepts(machine, input), input).toBe(false)
  })

  it('supports multiple single-character nonterminals', () => {
    const machine = generatedMachine('S -> AB\nA -> aA | ε\nB -> bB | ε')
    for (const input of ['', 'a', 'b', 'aaabbb']) expect(accepts(machine, input), input || 'ε').toBe(true)
    for (const input of ['ba', 'aba', 'bba']) expect(accepts(machine, input), input).toBe(false)
  })

  it('rejects grammar syntax the character-stack engine cannot represent safely', () => {
    expect(() => parseGrammar('Expr -> a')).toThrow(/single-character nonterminals/i)
    expect(() => parseGrammar('S -> a -> b')).toThrow(/Invalid production/)
  })
})
