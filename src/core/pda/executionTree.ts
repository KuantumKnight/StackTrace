import { allNextConfigurations, initialConfiguration } from './simulator'
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
  // A configuration reached earlier is only a safe merge when it was reached
  // at the same or a shallower depth. A shallower path has more remaining
  // depth budget, so a later, deeper visit cannot stand in for it.
  const visited = new Map([[configurationKey(root.config), root.depth]])
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

    const children = allNextConfigurations(machine, node.config, mode, counter)
    for (const rawChild of children) {
      const id = `n${counter++}`
      const childDepth = node.depth + 1
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
      const previousDepth = visited.get(key)
      if (config.status === 'active' && previousDepth !== undefined && previousDepth <= childDepth) {
        config = {
          ...config,
          status: 'merged',
          reason: 'Equivalent configuration already explored; this branch shares its future with another branch.',
        }
      } else if (config.status === 'active') {
        visited.set(key, childDepth)
      }

      // A merged branch does not need to consume a node budget: its future is
      // already represented by the earlier visit. This avoids reporting a
      // false search limit when the final remaining branches are reconvergent.
      if (nodes.length >= maxNodes) {
        if (config.status === 'merged') continue
        truncated = true
        return { nodes, truncated }
      }

      const child: ExecutionTreeNode = {
        id,
        parentId: node.id,
        transitionId: config.transitionId,
        depth: childDepth,
        config,
      }
      nodes.push(child)
      if (config.status === 'active') queue.push(child)
    }
  }

  return { nodes, truncated }
}
