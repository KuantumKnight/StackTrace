import type { Grammar } from './grammarParser'

export type DiagnosticLevel = 'warning' | 'info'

export interface GrammarDiagnostic {
  code: 'undefined-symbol' | 'unreachable-symbol' | 'non-generating-symbol'
  level: DiagnosticLevel
  symbol: string
  message: string
}

function referencedNonTerminals(grammar: Grammar, source: string) {
  return [...source].filter((symbol) => grammar.nonTerminals.includes(symbol))
}

export function grammarDiagnostics(grammar: Grammar): GrammarDiagnostic[] {
  const diagnostics: GrammarDiagnostic[] = []
  const defined = new Set(grammar.nonTerminals)

  const undefinedSymbols = new Set<string>()
  for (const production of grammar.productions) {
    for (const alternative of production.right) {
      for (const symbol of alternative) {
        if (/[A-Z]/.test(symbol) && !defined.has(symbol)) undefinedSymbols.add(symbol)
      }
    }
  }
  for (const symbol of [...undefinedSymbols].sort()) {
    diagnostics.push({
      code: 'undefined-symbol',
      level: 'warning',
      symbol,
      message: `${symbol} is referenced on a right-hand side but has no production.`,
    })
  }

  const reachable = new Set([grammar.startSymbol])
  let changed = true
  while (changed) {
    changed = false
    for (const production of grammar.productions) {
      if (!reachable.has(production.left)) continue
      for (const alternative of production.right) {
        for (const symbol of referencedNonTerminals(grammar, alternative)) {
          if (!reachable.has(symbol)) {
            reachable.add(symbol)
            changed = true
          }
        }
      }
    }
  }

  for (const symbol of grammar.nonTerminals.filter((item) => !reachable.has(item))) {
    diagnostics.push({
      code: 'unreachable-symbol',
      level: 'info',
      symbol,
      message: `${symbol} cannot be reached from start symbol ${grammar.startSymbol}.`,
    })
  }

  const generating = new Set<string>()
  changed = true
  while (changed) {
    changed = false
    for (const production of grammar.productions) {
      if (generating.has(production.left)) continue
      const canGenerate = production.right.some((alternative) => {
        if (alternative === 'ε') return true
        return [...alternative].every((symbol) => !defined.has(symbol) || generating.has(symbol))
      })
      if (canGenerate) {
        generating.add(production.left)
        changed = true
      }
    }
  }

  for (const symbol of grammar.nonTerminals.filter((item) => !generating.has(item))) {
    diagnostics.push({
      code: 'non-generating-symbol',
      level: 'warning',
      symbol,
      message: `${symbol} cannot derive a terminal-only string.`,
    })
  }

  return diagnostics
}
