import { initialConfiguration, nextConfigurations } from './simulator'
import type { AcceptanceMode, Configuration, PDA } from './types'

export interface ExecutionTreeNode {
  id: string
  parentId: string | null
  transitionId: string | null
  depth: number
  config: Configuration
}

export interface ExecutionTreeResult {
  nodes: ExecutionTreeNode[]
  truncated: boolean
}

function configurationKey(config: Configuration) {
  return `${config.state}|${config.inputIndex}|${config.stack.join('\u0001')}`
}

export function buildExecutionTree(
  machine: PDA,
  input: string,
  mode: AcceptanceMode,
  maxDepth = 10,
  maxNodes = 90,
  maxStackDepth = 64,
): ExecutionTreeResult {
  const rootConfig = initialConfiguration(machine, input, mode)
  const root: ExecutionTreeNode = {
    id: 'n0',
    parentId: null,
    transitionId: null,
    depth: 0,
    config: { ...rootConfig, id: 'n0' },
  }

  const nodes: ExecutionTreeNode[] = [root]
  const queue: ExecutionTreeNode[] = [root]
  const visited = new Set([configurationKey(root.config)])
  let counter = 1
  let truncated = false

  while (queue.length) {
    const node = queue.shift()!
    if (node.config.status !== 'active') continue

    if (node.depth >= maxDepth) {
      node.config = {
        ...node.config,
        status: 'limit',
        reason: `Execution depth limit ${maxDepth} reached.`,
      }
      truncated = true
      continue
    }

    const children = nextConfigurations(machine, node.config, mode, counter)
    for (const rawChild of children) {
      if (nodes.length >= maxNodes) {
        truncated = true
        return { nodes, truncated }
      }

      const id = `n${counter++}`
      let config: Configuration = {
        ...rawChild,
        id,
        parentId: node.id,
      }

      if (config.stack.length > maxStackDepth) {
        config = {
          ...config,
          status: 'limit',
          reason: `Stack depth limit ${maxStackDepth} reached.`,
        }
        truncated = true
      }

      const key = configurationKey(config)
      if (config.status === 'active' && visited.has(key)) {
        config = {
          ...config,
          status: 'limit',
          reason: 'Repeated configuration stopped to prevent an infinite ε-loop.',
        }
        truncated = true
      } else if (config.status === 'active') {
        visited.add(key)
      }

      const child: ExecutionTreeNode = {
        id,
        parentId: node.id,
        transitionId: config.transitionId,
        depth: node.depth + 1,
        config,
      }
      nodes.push(child)
      if (config.status === 'active') queue.push(child)
    }
  }

  return { nodes, truncated }
}
