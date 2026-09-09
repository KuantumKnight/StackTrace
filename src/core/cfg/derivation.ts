import type { Grammar } from './grammarParser'

export type DerivationMode = 'leftmost' | 'rightmost'

export interface DerivationStep {
  id: string
  before: string
  after: string
  nonTerminal: string
  replacement: string
  index: number
  production: string
}

export interface DerivationResult {
  status: 'found' | 'not-found' | 'limit'
  steps: DerivationStep[]
  forms: string[]
  explored: number
  reason?: string
}

interface SearchNode {
  form: string
  steps: DerivationStep[]
}

function findExpandableIndex(form: string, grammar: Grammar, mode: DerivationMode) {
  const indexes = [...form]
    .map((symbol, index) => grammar.nonTerminals.includes(symbol) ? index : -1)
    .filter((index) => index >= 0)

  if (!indexes.length) return -1
  return mode === 'leftmost' ? indexes[0] : indexes[indexes.length - 1]
}

function isCompatible(form: string, target: string, grammar: Grammar) {
  const symbols = [...form]
  const terminalCount = symbols.filter((symbol) => !grammar.nonTerminals.includes(symbol)).length
  if (terminalCount > target.length) return false

  const firstVariable = symbols.findIndex((symbol) => grammar.nonTerminals.includes(symbol))
  if (firstVariable === -1) return form === target

  const lastVariable = symbols.reduce((last, symbol, index) => grammar.nonTerminals.includes(symbol) ? index : last, -1)
  const prefix = symbols.slice(0, firstVariable).join('')
  const suffix = symbols.slice(lastVariable + 1).join('')

  return target.startsWith(prefix) && target.endsWith(suffix)
}

export function deriveTarget(
  grammar: Grammar,
  target: string,
  mode: DerivationMode = 'leftmost',
  maxDepth = 28,
  maxExplored = 4000,
): DerivationResult {
  const start = grammar.startSymbol
  if (start === target) return { status: 'found', steps: [], forms: [start], explored: 1 }

  const queue: SearchNode[] = [{ form: start, steps: [] }]
  const visited = new Set<string>([start])
  let explored = 0

  while (queue.length && explored < maxExplored) {
    const node = queue.shift()!
    explored += 1

    if (node.steps.length >= maxDepth) continue
    const index = findExpandableIndex(node.form, grammar, mode)
    if (index < 0) continue

    const nonTerminal = node.form[index]
    const production = grammar.productions.find((item) => item.left === nonTerminal)
    if (!production) continue

    for (const alternative of production.right) {
      const replacement = alternative === 'ε' ? '' : alternative
      const after = `${node.form.slice(0, index)}${replacement}${node.form.slice(index + 1)}`
      if (!isCompatible(after, target, grammar)) continue

      const step: DerivationStep = {
        id: `d${node.steps.length + 1}-${index}-${alternative || 'ε'}`,
        before: node.form,
        after,
        nonTerminal,
        replacement,
        index,
        production: `${nonTerminal} → ${alternative || 'ε'}`,
      }
      const steps = [...node.steps, step]

      if (after === target) {
        return {
          status: 'found',
          steps,
          forms: [start, ...steps.map((item) => item.after)],
          explored,
        }
      }

      if (!visited.has(after)) {
        visited.add(after)
        queue.push({ form: after, steps })
      }
    }
  }

  if (explored >= maxExplored) {
    return {
      status: 'limit',
      steps: [],
      forms: [start],
      explored,
      reason: `Search stopped after ${maxExplored} sentential forms.`,
    }
  }

  return {
    status: 'not-found',
    steps: [],
    forms: [start],
    explored,
    reason: `No ${mode} derivation reached ${target || 'ε'} within depth ${maxDepth}.`,
  }
}
