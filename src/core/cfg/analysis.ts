import type { Grammar, Production } from './grammarParser'

const EPSILON = 'ε'
const END = '$'

export interface AmbiguityWitness {
  value: string
  derivations: string[][]
  explored: number
}

export interface GrammarAnalysis {
  first: Record<string, string[]>
  follow: Record<string, string[]>
  nullable: string[]
  directLeftRecursive: string[]
  leftFactorable: string[]
  unreachable: string[]
  nonGenerating: string[]
  undefinedVariables: string[]
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

function longestCommonPrefix(values: string[]) {
  if (values.length < 2) return ''
  let prefix = values[0]
  for (const value of values.slice(1)) {
    let index = 0
    while (index < prefix.length && index < value.length && prefix[index] === value[index]) index += 1
    prefix = prefix.slice(0, index)
    if (!prefix) break
  }
  return prefix
}

function factoringGroups(alternatives: string[]) {
  const groups = new Map<string, string[]>()
  for (const alternative of alternatives) {
    if (alternative === EPSILON || !alternative.length) continue
    const group = groups.get(alternative[0]) || []
    group.push(alternative)
    groups.set(alternative[0], group)
  }
  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({ alternatives: group, prefix: longestCommonPrefix(group) }))
    .filter((group) => group.prefix.length > 0)
}

function structuralDiagnostics(grammar: Grammar) {
  const reachable = new Set([grammar.startSymbol])
  let changed = true
  while (changed) {
    changed = false
    for (const production of grammar.productions) {
      if (!reachable.has(production.left)) continue
      for (const alternative of production.right) {
        for (const symbol of symbolsOf(alternative)) {
          if (grammar.nonTerminals.includes(symbol) && !reachable.has(symbol)) {
            reachable.add(symbol)
            changed = true
          }
        }
      }
    }
  }

  const generating = new Set<string>()
  changed = true
  while (changed) {
    changed = false
    for (const production of grammar.productions) {
      if (generating.has(production.left)) continue
      if (production.right.some((alternative) => symbolsOf(alternative).every((symbol) => !grammar.nonTerminals.includes(symbol) || generating.has(symbol)))) {
        generating.add(production.left)
        changed = true
      }
    }
  }

  const undefinedVariables = [...new Set(
    grammar.productions.flatMap((production) => production.right)
      .flatMap(symbolsOf)
      .filter((symbol) => /^[A-Z]$/.test(symbol) && !grammar.nonTerminals.includes(symbol)),
  )]

  return {
    unreachable: grammar.nonTerminals.filter((symbol) => !reachable.has(symbol)),
    nonGenerating: grammar.nonTerminals.filter((symbol) => !generating.has(symbol)),
    undefinedVariables,
  }
}

export function analyzeGrammar(grammar: Grammar): GrammarAnalysis {
  const first = computeFirstSets(grammar)
  const follow = computeFollowSets(grammar, first)
  const nullable = grammar.nonTerminals.filter((symbol) => first.get(symbol)?.has(EPSILON))
  const directLeftRecursive = grammar.productions
    .filter((production) => production.right.some((alternative) => alternative !== EPSILON && alternative.startsWith(production.left)))
    .map((production) => production.left)
  const leftFactorable = grammar.productions
    .filter((production) => factoringGroups(production.right).length > 0)
    .map((production) => production.left)
  const diagnostics = structuralDiagnostics(grammar)

  const toRecord = (sets: Map<string, Set<string>>) => Object.fromEntries(
    [...sets.entries()].map(([symbol, values]) => [symbol, [...values].sort((a, b) => a.localeCompare(b))]),
  )

  return {
    first: toRecord(first),
    follow: toRecord(follow),
    nullable,
    directLeftRecursive: [...new Set(directLeftRecursive)],
    leftFactorable: [...new Set(leftFactorable)],
    ...diagnostics,
  }
}

function freshNonTerminal(used: Set<string>) {
  for (const candidate of 'ZYXWVUTSRQPONMLKJIHGFEDCBA') {
    if (!used.has(candidate)) return candidate
  }
  throw new Error('No free single-letter non-terminal is available for the transformation.')
}

function rebuildGrammar(startSymbol: string, productions: Production[]): Grammar {
  const nonTerminals = [...new Set(productions.map((production) => production.left))]
  const symbolText = productions.flatMap((production) => production.right).join('')
  const terminals = [...new Set([...symbolText].filter((char) => char !== EPSILON && !nonTerminals.includes(char) && !/\s/.test(char)))]
  return { startSymbol, productions, nonTerminals, terminals }
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

  return rebuildGrammar(grammar.startSymbol, transformed)
}

export function leftFactorGrammar(grammar: Grammar): Grammar {
  const used = new Set(grammar.nonTerminals)
  const transformed: Production[] = []

  for (const production of grammar.productions) {
    const groups = factoringGroups(production.right)
    if (!groups.length) {
      transformed.push({ left: production.left, right: [...production.right] })
      continue
    }

    const grouped = new Set(groups.flatMap((group) => group.alternatives))
    const right = production.right.filter((alternative) => !grouped.has(alternative))

    for (const group of groups) {
      const fresh = freshNonTerminal(used)
      used.add(fresh)
      right.push(`${group.prefix}${fresh}`)
      transformed.push({
        left: fresh,
        right: group.alternatives.map((alternative) => alternative.slice(group.prefix.length) || EPSILON),
      })
    }

    transformed.unshift({ left: production.left, right })
  }

  return rebuildGrammar(grammar.startSymbol, transformed)
}

export function findAmbiguityWitness(grammar: Grammar, maxTerminalLength = 6, maxDepth = 10, maxForms = 3000): AmbiguityWitness | null {
  interface SearchNode { form: string; depth: number; path: string[] }
  const queue: SearchNode[] = [{ form: grammar.startSymbol, depth: 0, path: [grammar.startSymbol] }]
  const completed = new Map<string, string[][]>()
  const seenCounts = new Map<string, number>()
  let explored = 0

  while (queue.length && explored < maxForms) {
    const node = queue.shift()!
    explored += 1
    const terminalCount = [...node.form].filter((symbol) => !grammar.nonTerminals.includes(symbol)).length
    if (terminalCount > maxTerminalLength || node.depth > maxDepth) continue

    const index = [...node.form].findIndex((symbol) => grammar.nonTerminals.includes(symbol))
    if (index < 0) {
      if (node.form.length > maxTerminalLength) continue
      const paths = completed.get(node.form) || []
      if (!paths.some((path) => path.join('\u0001') === node.path.join('\u0001'))) paths.push(node.path)
      completed.set(node.form, paths)
      if (paths.length >= 2) return { value: node.form, derivations: paths.slice(0, 2), explored }
      continue
    }

    const variable = node.form[index]
    const production = grammar.productions.find((item) => item.left === variable)
    if (!production) continue

    for (const alternative of production.right) {
      const replacement = alternative === EPSILON ? '' : alternative
      const next = node.form.slice(0, index) + replacement + node.form.slice(index + 1)
      const count = seenCounts.get(next) || 0
      if (count >= 3) continue
      seenCounts.set(next, count + 1)
      queue.push({ form: next, depth: node.depth + 1, path: [...node.path, next || EPSILON] })
    }
  }

  return null
}

export function grammarToSource(grammar: Grammar) {
  return grammar.productions.map((production) => `${production.left} -> ${production.right.join(' | ')}`).join('\n')
}
