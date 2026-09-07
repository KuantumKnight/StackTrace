import type { Grammar } from './grammarParser'

export interface AmbiguityWitness {
  value: string
  derivationA: string[]
  derivationB: string[]
}

export interface AmbiguitySearchResult {
  witness: AmbiguityWitness | null
  explored: number
  truncated: boolean
}

interface SearchNode {
  form: string
  forms: string[]
  signature: string
  depth: number
}

function firstNonTerminalIndex(form: string, grammar: Grammar) {
  return [...form].findIndex((symbol) => grammar.nonTerminals.includes(symbol))
}

function terminalLength(form: string, grammar: Grammar) {
  return [...form].filter((symbol) => !grammar.nonTerminals.includes(symbol)).length
}

export function findAmbiguityWitness(
  grammar: Grammar,
  maxTerminalLength = 8,
  maxDepth = 14,
  maxNodes = 4000,
): AmbiguitySearchResult {
  const queue: SearchNode[] = [{ form: grammar.startSymbol, forms: [grammar.startSymbol], signature: '', depth: 0 }]
  const signaturesByForm = new Map<string, Set<string>>([[grammar.startSymbol, new Set([''])]])
  const terminalDerivations = new Map<string, SearchNode>()
  let explored = 0
  let truncated = false

  while (queue.length && explored < maxNodes) {
    const node = queue.shift()!
    explored += 1

    const index = firstNonTerminalIndex(node.form, grammar)
    if (index < 0) {
      if (node.form.length <= maxTerminalLength) {
        const previous = terminalDerivations.get(node.form)
        if (previous && previous.signature !== node.signature) {
          return {
            witness: { value: node.form || 'ε', derivationA: previous.forms, derivationB: node.forms },
            explored,
            truncated: false,
          }
        }
        terminalDerivations.set(node.form, node)
      }
      continue
    }

    if (node.depth >= maxDepth || terminalLength(node.form, grammar) > maxTerminalLength) continue
    const variable = node.form[index]
    const production = grammar.productions.find((item) => item.left === variable)
    if (!production) continue

    for (const alternative of [...new Set(production.right)]) {
      const replacement = alternative === 'ε' ? '' : alternative
      const nextForm = `${node.form.slice(0, index)}${replacement}${node.form.slice(index + 1)}`
      if (terminalLength(nextForm, grammar) > maxTerminalLength) continue
      if (nextForm.length > maxTerminalLength + maxDepth) continue

      const signature = `${node.signature}|${variable}@${index}->${alternative}`
      const known = signaturesByForm.get(nextForm) ?? new Set<string>()
      if (known.has(signature) || known.size >= 2) continue
      known.add(signature)
      signaturesByForm.set(nextForm, known)
      queue.push({
        form: nextForm,
        forms: [...node.forms, nextForm || 'ε'],
        signature,
        depth: node.depth + 1,
      })
    }
  }

  if (queue.length) truncated = true
  return { witness: null, explored, truncated }
}
