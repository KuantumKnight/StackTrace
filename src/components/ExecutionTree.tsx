import { useMemo, useState } from 'react'
import { buildExecutionTree } from '../core/pda/executionTree'
import type { AcceptanceMode, Configuration, PDA } from '../core/pda/types'

interface ExecutionTreeProps {
  machine: PDA
  input: string
  mode: AcceptanceMode
  onSelectPath?: (path: Configuration[]) => void
}

interface PositionedNode {
  id: string
  parentId: string | null
  x: number
  y: number
  state: string
  unread: string
  stack: string
  status: string
  transitionId: string | null
  reason?: string
}

export function ExecutionTree({ machine, input, mode, onSelectPath }: ExecutionTreeProps) {
  const result = useMemo(() => buildExecutionTree(machine, input, mode), [machine, input, mode])
  const [selectedId, setSelectedId] = useState('n0')

  const positioned = useMemo(() => {
    const byDepth = new Map<number, typeof result.nodes>()
    for (const node of result.nodes) {
      const group = byDepth.get(node.depth) || []
      group.push(node)
      byDepth.set(node.depth, group)
    }

    const width = 760
    const rowGap = 88
    const top = 36
    const nodes: PositionedNode[] = []

    for (const [depth, group] of byDepth.entries()) {
      group.forEach((node, index) => {
        const segment = width / (group.length + 1)
        nodes.push({
          id: node.id,
          parentId: node.parentId,
          x: segment * (index + 1),
          y: top + depth * rowGap,
          state: node.config.state,
          unread: node.config.input.slice(node.config.inputIndex) || 'ε',
          stack: node.config.stack.join('') || 'ε',
          status: node.config.status,
          transitionId: node.transitionId,
          reason: node.config.reason,
        })
      })
    }

    return nodes
  }, [result.nodes])

  const height = Math.max(180, 78 + Math.max(...positioned.map((node) => node.y), 80))
  const selected = positioned.find((node) => node.id === selectedId) || positioned[0]

  const selectNode = (id: string) => {
    setSelectedId(id)
    if (!onSelectPath) return

    const byId = new Map(result.nodes.map((node) => [node.id, node]))
    const path: Configuration[] = []
    let cursor = byId.get(id)
    while (cursor) {
      path.unshift({ ...cursor.config })
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
    }
    if (path.length) onSelectPath(path)
  }

  return (
    <section className="panel execution-tree-panel" id="execution-tree">
      <div className="panel-heading">
        <div><span>NPDA EXECUTION TREE</span><span className="heading-separator">/</span><span>{result.nodes.length} NODES</span></div>
        <span>{result.truncated ? 'BOUNDED SEARCH' : 'COMPLETE SEARCH'}</span>
      </div>
      <div className="execution-tree-scroller">
        <svg viewBox={`0 0 760 ${height}`} className="execution-tree-svg" role="img" aria-label="Nondeterministic PDA execution tree">
          {positioned.filter((node) => node.parentId).map((node) => {
            const parent = positioned.find((candidate) => candidate.id === node.parentId)
            if (!parent) return null
            const midY = (parent.y + node.y) / 2
            return <path key={`edge-${node.id}`} className={`tree-edge ${node.status}`} d={`M ${parent.x} ${parent.y + 18} C ${parent.x} ${midY}, ${node.x} ${midY}, ${node.x} ${node.y - 18}`} />
          })}
          {positioned.map((node) => (
            <g
              key={node.id}
              className={`tree-node ${node.status} ${selected?.id === node.id ? 'selected' : ''}`}
              transform={`translate(${node.x} ${node.y})`}
              onClick={() => selectNode(node.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && selectNode(node.id)}
            >
              <circle r="17" />
              <text className="tree-state" textAnchor="middle" y="3">{node.state.replace('qAccept', 'qA')}</text>
              <text className="tree-node-id" textAnchor="middle" y="31">{node.id.toUpperCase()}</text>
            </g>
          ))}
        </svg>
      </div>
      {selected && (
        <div className="tree-inspector" aria-live="polite">
          <span><small>NODE</small><b>{selected.id.toUpperCase()}</b></span>
          <span><small>STATE</small><b>{selected.state}</b></span>
          <span><small>UNREAD</small><b>{selected.unread}</b></span>
          <span><small>STACK</small><b>{selected.stack}</b></span>
          <span><small>STATUS</small><b className={selected.status}>{selected.status}</b></span>
          {onSelectPath && <span><small>ACTION</small><b>CLICK = LOAD BRANCH</b></span>}
          {selected.reason && <span className="tree-reason"><small>WHY</small><b>{selected.reason}</b></span>}
        </div>
      )}
    </section>
  )
}
