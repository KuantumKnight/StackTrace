import { buildExecutionTree, type ExecutionTreeNode } from './executionTree'
import type { AcceptanceMode, Configuration, PDA } from './types'

export type SearchVerdict = 'accepted' | 'rejected' | 'limit'

export interface RejectionAnalysis {
  verdict: SearchVerdict
  explored: number
  deadBranches: number
  limitedBranches: number
  acceptingDepth?: number
  closest?: Configuration
  closestPath: Configuration[]
  truncated: boolean
}

function pathTo(node: ExecutionTreeNode, nodes: ExecutionTreeNode[]) {
  const byId = new Map(nodes.map((item) => [item.id, item]))
  const path: Configuration[] = []
  let cursor: ExecutionTreeNode | undefined = node
  while (cursor) {
    path.unshift({ ...cursor.config, stack: [...cursor.config.stack] })
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
  }
  return path
}

function closestFailure(nodes: ExecutionTreeNode[]) {
  return nodes
    .filter((node) => node.config.status === 'dead' || node.config.status === 'limit')
    .sort((a, b) => {
      if (b.config.inputIndex !== a.config.inputIndex) return b.config.inputIndex - a.config.inputIndex
      if (a.config.stack.length !== b.config.stack.length) return a.config.stack.length - b.config.stack.length
      return b.depth - a.depth
    })[0]
}

export function analyzePDAOutcome(
  machine: PDA,
  input: string,
  mode: AcceptanceMode,
  maxDepth = 40,
  maxNodes = 1200,
  maxStackDepth = 64,
): RejectionAnalysis {
  const tree = buildExecutionTree(machine, input, mode, maxDepth, maxNodes, maxStackDepth)
  const accepting = tree.nodes
    .filter((node) => node.config.status === 'accepted')
    .sort((a, b) => a.depth - b.depth)[0]
  const closestNode = closestFailure(tree.nodes)
  const limitedBranches = tree.nodes.filter((node) => node.config.status === 'limit').length
  const deadBranches = tree.nodes.filter((node) => node.config.status === 'dead').length

  return {
    verdict: accepting ? 'accepted' : tree.truncated || limitedBranches ? 'limit' : 'rejected',
    explored: tree.nodes.length,
    deadBranches,
    limitedBranches,
    acceptingDepth: accepting?.depth,
    closest: closestNode ? { ...closestNode.config, stack: [...closestNode.config.stack] } : undefined,
    closestPath: closestNode ? pathTo(closestNode, tree.nodes) : [],
    truncated: tree.truncated,
  }
}
