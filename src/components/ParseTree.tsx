import { useMemo } from 'react'
import type { ParseTreeModel, ParseTreeNode } from '../core/cfg/parseTree'

interface ParseTreeProps {
  tree: ParseTreeModel
  activeStep: number
}

interface PositionedNode extends ParseTreeNode {
  x: number
  y: number
}

export function ParseTree({ tree, activeStep }: ParseTreeProps) {
  const layout = useMemo(() => {
    const byId = new Map(tree.nodes.map((node) => [node.id, node]))
    let leafCursor = 0
    const positions = new Map<string, number>()

    const position = (id: string): number => {
      const node = byId.get(id)!
      if (!node.children.length) {
        const x = leafCursor++
        positions.set(id, x)
        return x
      }
      const childXs = node.children.map(position)
      const x = childXs.reduce((sum, value) => sum + value, 0) / childXs.length
      positions.set(id, x)
      return x
    }

    position(tree.rootId)
    const leaves = Math.max(leafCursor, 1)
    const width = Math.max(520, leaves * 86)
    const maxDepth = Math.max(...tree.nodes.map((node) => node.depth), 0)
    const height = Math.max(180, 72 + maxDepth * 82)
    const nodes: PositionedNode[] = tree.nodes.map((node) => ({
      ...node,
      x: leaves === 1 ? width / 2 : 54 + ((positions.get(node.id) || 0) / (leaves - 1)) * (width - 108),
      y: 38 + node.depth * 78,
    }))

    return { nodes, width, height }
  }, [tree])

  return (
    <div className="parse-tree-canvas">
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} role="img" aria-label="Grammar parse tree">
        {layout.nodes.filter((node) => node.parentId).map((node) => {
          const parent = layout.nodes.find((candidate) => candidate.id === node.parentId)!
          const active = node.createdStep === activeStep
          return <path key={`edge-${node.id}`} className={`parse-edge ${active ? 'active' : ''}`} d={`M ${parent.x} ${parent.y + 18} C ${parent.x} ${parent.y + 42}, ${node.x} ${node.y - 42}, ${node.x} ${node.y - 18}`} />
        })}
        {layout.nodes.map((node) => {
          const active = node.createdStep === activeStep
          const future = node.createdStep > activeStep
          return (
            <g key={node.id} className={`parse-node ${active ? 'active' : ''} ${future ? 'future' : ''}`} transform={`translate(${node.x} ${node.y})`}>
              <circle r="17" />
              <text textAnchor="middle" y="4">{node.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
