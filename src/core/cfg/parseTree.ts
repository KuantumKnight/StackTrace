import type { DerivationStep } from './derivation'

export interface ParseTreeNode {
  id: string
  label: string
  parentId: string | null
  children: string[]
  depth: number
  createdStep: number
}

export interface ParseTreeModel {
  rootId: string
  nodes: ParseTreeNode[]
}

export function buildParseTree(startSymbol: string, steps: DerivationStep[]): ParseTreeModel {
  const root: ParseTreeNode = {
    id: 'p0',
    label: startSymbol,
    parentId: null,
    children: [],
    depth: 0,
    createdStep: 0,
  }

  const nodes: ParseTreeNode[] = [root]
  let frontier = [root.id]
  let counter = 1

  steps.forEach((step, stepIndex) => {
    const parentId = frontier[step.index]
    const parent = nodes.find((node) => node.id === parentId)
    if (!parent) return

    const labels = step.replacement ? [...step.replacement] : ['ε']
    const children = labels.map((label) => {
      const child: ParseTreeNode = {
        id: `p${counter++}`,
        label,
        parentId: parent.id,
        children: [],
        depth: parent.depth + 1,
        createdStep: stepIndex + 1,
      }
      nodes.push(child)
      return child
    })

    parent.children = children.map((child) => child.id)
    const visibleChildren = children.filter((child) => child.label !== 'ε').map((child) => child.id)
    frontier = [...frontier.slice(0, step.index), ...visibleChildren, ...frontier.slice(step.index + 1)]
  })

  return { rootId: root.id, nodes }
}
