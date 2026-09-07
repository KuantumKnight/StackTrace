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

export function parseGrammar(source: string): Grammar {
  const lines = source.split('\n').map((line) => line.trim()).filter(Boolean)
  if (!lines.length) throw new Error('Grammar is empty.')

  const productions: Production[] = lines.map((line) => {
    const [rawLeft, rawRight] = line.split(/->|→/).map((part) => part?.trim())
    if (!rawLeft || rawRight === undefined) throw new Error(`Invalid production: ${line}`)
    return { left: rawLeft, right: rawRight.split('|').map((part) => part.trim() || 'ε') }
  })

  const nonTerminals = [...new Set(productions.map((p) => p.left))]
  const symbolText = productions.flatMap((p) => p.right).join('')
  const terminals = [...new Set([...symbolText].filter((char) => char !== 'ε' && !nonTerminals.includes(char) && !/\s/.test(char)))]

  return { startSymbol: productions[0].left, productions, nonTerminals, terminals }
}
