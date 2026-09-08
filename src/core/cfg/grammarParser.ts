export interface Production {
  left: string
  right: string[]
}

export interface Grammar {
  startSymbol: string
  productions: Production[]
  nonTerminals: string[]
  terminals: string[]
}

function normalizeAlternative(value: string) {
  const compact = value.replace(/\s+/g, '')
  if (!compact || compact === 'ε' || compact === 'λ' || /^(epsilon|eps|lambda)$/i.test(compact)) return 'ε'
  return compact
}

export function parseGrammar(source: string): Grammar {
  const lines = source.split('\n').map((line) => line.trim()).filter(Boolean)
  if (!lines.length) throw new Error('Grammar is empty.')

  const productions: Production[] = lines.map((line) => {
    const arrows = line.match(/->|→/g) ?? []
    if (arrows.length !== 1) throw new Error(`Invalid production: ${line}`)

    const [rawLeft, rawRight] = line.split(/->|→/).map((part) => part?.trim())
    if (!rawLeft || rawRight === undefined) throw new Error(`Invalid production: ${line}`)

    const left = rawLeft.replace(/\s+/g, '')
    if ([...left].length !== 1 || left === 'ε' || left === 'λ') {
      throw new Error(`StackTrace currently requires single-character nonterminals. Invalid left side: ${rawLeft}`)
    }

    return {
      left,
      right: rawRight.split('|').map(normalizeAlternative),
    }
  })

  const nonTerminals = [...new Set(productions.map((p) => p.left))]
  const symbolText = productions.flatMap((p) => p.right).join('')
  const terminals = [...new Set([...symbolText].filter((char) => char !== 'ε' && !nonTerminals.includes(char)))]

  return { startSymbol: productions[0].left, productions, nonTerminals, terminals }
}
