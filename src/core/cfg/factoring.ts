import type { Grammar, Production } from './grammarParser'

const EPSILON = 'ε'

export interface LeftFactoringOpportunity {
  left: string
  prefix: string
  alternatives: string[]
}

function commonPrefix(a: string, b: string) {
  let index = 0
  while (index < a.length && index < b.length && a[index] === b[index]) index += 1
  return a.slice(0, index)
}

export function findLeftFactoringOpportunities(grammar: Grammar): LeftFactoringOpportunity[] {
  const opportunities: LeftFactoringOpportunity[] = []

  for (const production of grammar.productions) {
    const alternatives = [...new Set(production.right.filter((alternative) => alternative !== EPSILON))]
    const prefixes = new Set<string>()
    for (let i = 0; i < alternatives.length; i += 1) {
      for (let j = i + 1; j < alternatives.length; j += 1) {
        const prefix = commonPrefix(alternatives[i], alternatives[j])
        if (prefix) prefixes.add(prefix)
      }
    }

    const candidates = [...prefixes]
      .map((prefix) => ({ prefix, alternatives: alternatives.filter((item) => item.startsWith(prefix)) }))
      .filter((item) => item.alternatives.length >= 2)
      .sort((a, b) => b.prefix.length - a.prefix.length || b.alternatives.length - a.alternatives.length)

    if (candidates[0]) opportunities.push({ left: production.left, ...candidates[0] })
  }

  return opportunities
}

function freshNonTerminal(used: Set<string>) {
  for (const candidate of 'ZYXWVUTSRQPONMLKJIHGFEDCBA') {
    if (!used.has(candidate)) return candidate
  }
  throw new Error('No free single-letter non-terminal is available for left factoring.')
}

function rebuildGrammar(startSymbol: string, productions: Production[]): Grammar {
  const nonTerminals = [...new Set(productions.map((production) => production.left))]
  const symbolText = productions.flatMap((production) => production.right).join('')
  const terminals = [...new Set([...symbolText].filter((symbol) => symbol !== EPSILON && !nonTerminals.includes(symbol) && !/\s/.test(symbol)))]
  return { startSymbol, productions, nonTerminals, terminals }
}

export function applyOneLeftFactoringStep(grammar: Grammar): Grammar {
  const opportunity = findLeftFactoringOpportunities(grammar)[0]
  if (!opportunity) return grammar

  const used = new Set(grammar.nonTerminals)
  const fresh = freshNonTerminal(used)
  const productions: Production[] = []

  for (const production of grammar.productions) {
    if (production.left !== opportunity.left) {
      productions.push({ left: production.left, right: [...production.right] })
      continue
    }

    const grouped = new Set(opportunity.alternatives)
    const untouched = production.right.filter((alternative) => !grouped.has(alternative))
    productions.push({
      left: production.left,
      right: [...untouched, `${opportunity.prefix}${fresh}`],
    })
    productions.push({
      left: fresh,
      right: opportunity.alternatives.map((alternative) => alternative.slice(opportunity.prefix.length) || EPSILON),
    })
  }

  return rebuildGrammar(grammar.startSymbol, productions)
}

export function leftFactorGrammar(grammar: Grammar, maxSteps = 20): Grammar {
  let current = grammar
  for (let step = 0; step < maxSteps; step += 1) {
    if (!findLeftFactoringOpportunities(current).length) return current
    current = applyOneLeftFactoringStep(current)
  }
  throw new Error(`Left factoring exceeded ${maxSteps} transformation steps.`)
}
