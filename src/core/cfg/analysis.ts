import type { Grammar, Production } from './grammarParser'

const EPSILON = 'ε'
const END = '$'

export interface GrammarAnalysis {
  first: Record<string, string[]>
  follow: Record<string, string[]>
  nullable: string[]
  directLeftRecursive: string[]
}

function addAll(target: Set<string>, values: Iterable<string>) {
  let changed = false
  for (const value of values) {
    if (!target.has(value)) {
      target.add(value)
      changed = true
    }
  }
  return changed
}

function symbolsOf(alternative: string) {
  return alternative === EPSILON ? [] : [...alternative]
}

function firstOfSequence(sequence: string[], grammar: Grammar, firstSets: Map<string, Set<string>>) {
  const result = new Set<string>()
  if (!sequence.length) {
    result.add(EPSILON)
    return result
  }

  let allNullable = true
  for (const symbol of sequence) {
    if (!grammar.nonTerminals.includes(symbol)) {
      result.add(symbol)
      allNullable = false
      break
    }

    const current = firstSets.get(symbol) || new Set<string>()
    addAll(result, [...current].filter((item) => item !== EPSILON))
    if (!current.has(EPSILON)) {
      allNullable = false
      break
    }
  }

  if (allNullable) result.add(EPSILON)
  return result
}

export function computeFirstSets(grammar: Grammar) {
  const first = new Map(grammar.nonTerminals.map((symbol) => [symbol, new Set<string>()]))
  let changed = true

  while (changed) {
    changed = false
    for (const production of grammar.productions) {
      const target = first.get(production.left)!
      for (const alternative of production.right) {
        if (addAll(target, firstOfSequence(symbolsOf(alternative), grammar, first))) changed = true
      }
    }
  }

  return first
}

export function computeFollowSets(grammar: Grammar, first = computeFirstSets(grammar)) {
  const follow = new Map(grammar.nonTerminals.map((symbol) => [symbol, new Set<string>()]))
  follow.get(grammar.startSymbol)?.add(END)
  let changed = true

  while (changed) {
    changed = false
    for (const production of grammar.productions) {
      for (const alternative of production.right) {
        const symbols = symbolsOf(alternative)
        symbols.forEach((symbol, index) => {
          if (!grammar.nonTerminals.includes(symbol)) return
          const beta = symbols.slice(index + 1)
          const betaFirst = firstOfSequence(beta, grammar, first)
          const target = follow.get(symbol)!
          if (addAll(target, [...betaFirst].filter((item) => item !== EPSILON))) changed = true
          if (!beta.length || betaFirst.has(EPSILON)) {
            if (addAll(target, follow.get(production.left) || [])) changed = true
          }
        })
      }
    }
  }

  return follow
}

export function analyzeGrammar(grammar: Grammar): GrammarAnalysis {
  const first = computeFirstSets(grammar)
  const follow = computeFollowSets(grammar, first)
  const nullable = grammar.nonTerminals.filter((symbol) => first.get(symbol)?.has(EPSILON))
  const directLeftRecursive = grammar.productions
    .filter((production) => production.right.some((alternative) => alternative !== EPSILON && alternative.startsWith(production.left)))
    .map((production) => production.left)

  const toRecord = (sets: Map<string, Set<string>>) => Object.fromEntries(
    [...sets.entries()].map(([symbol, values]) => [symbol, [...values].sort((a, b) => a.localeCompare(b))]),
  )

  return {
    first: toRecord(first),
    follow: toRecord(follow),
    nullable,
    directLeftRecursive: [...new Set(directLeftRecursive)],
  }
}

function freshNonTerminal(used: Set<string>) {
  for (const candidate of 'ZYXWVUTSRQPONMLKJIHGFEDCBA') {
    if (!used.has(candidate)) return candidate
  }
  throw new Error('No free single-letter non-terminal is available for the transformation.')
}

export function removeDirectLeftRecursion(grammar: Grammar): Grammar {
  const used = new Set(grammar.nonTerminals)
  const transformed: Production[] = []

  for (const production of grammar.productions) {
    const recursive = production.right.filter((alternative) => alternative !== EPSILON && alternative.startsWith(production.left))
    if (!recursive.length) {
      transformed.push({ left: production.left, right: [...production.right] })
      continue
    }

    const nonRecursive = production.right.filter((alternative) => !recursive.includes(alternative))
    const fresh = freshNonTerminal(used)
    used.add(fresh)

    const betas = nonRecursive.length ? nonRecursive : [EPSILON]
    transformed.push({
      left: production.left,
      right: betas.map((beta) => beta === EPSILON ? fresh : `${beta}${fresh}`),
    })
    transformed.push({
      left: fresh,
      right: [...recursive.map((alpha) => `${alpha.slice(production.left.length)}${fresh}`), EPSILON],
    })
  }

  const nonTerminals = transformed.map((production) => production.left)
  const symbolText = transformed.flatMap((production) => production.right).join('')
  const terminals = [...new Set([...symbolText].filter((char) => char !== EPSILON && !nonTerminals.includes(char) && !/\s/.test(char)))]

  return {
    startSymbol: grammar.startSymbol,
    productions: transformed,
    nonTerminals,
    terminals,
  }
}

export function grammarToSource(grammar: Grammar) {
  return grammar.productions.map((production) => `${production.left} -> ${production.right.join(' | ')}`).join('\n')
}
