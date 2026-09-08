import { useMemo, useState } from 'react'
import { buildExecutionTree } from '../core/pda/executionTree'
import type { AcceptanceMode, Configuration, PDA } from '../core/pda/types'
import '../styles/tree-controls.css'

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
  const [showDead, setShowDead] = useState(true)

  const acceptedNode = useMemo(() => result.nodes
    .filter((node) => node.config.status === 'accepted')
    .sort((a, b) => a.depth - b.depth)[0], [result.nodes])

  const acceptingPath = useMemo(() => {
    const ids = new Set<string>()
    if (!acceptedNode) return ids
    const byId = new Map(result.nodes.map((node) => [node.id, node]))
    let cursor: typeof acceptedNode | undefined = acceptedNode
    while (cursor) {
      ids.add(cursor.id)
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
    }
    return ids
  }, [acceptedNode, result.nodes])

  const visibleSourceNodes = useMemo(
    () => showDead ? result.nodes : result.nodes.filter((node) => node.config.status !== 'dead'),
    [result.nodes, showDead],
  )

  const positioned = useMemo(() => {
    const byDepth = new Map<number, typeof visibleSourceNodes>()
    for (const node of visibleSourceNodes) {
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
  }, [visibleSourceNodes])

  const height = Math.max(180, 78 + Math.max(...positioned.map((node) => node.y), 80))
  const selected = positioned.find((node) => node.id === selectedId) || positioned[0]

  const selectNode = (id: string) => {
    setSelectedId(id)
    if (!onSelectPath) return

    const byId = new Map(result.nodes.map((node) => [node.id, node]))
    const path: Configuration[] = []
    let cursor = byId.get(id)
    while (cursor) {
      path.unshift({ ...cursor.config, stack: [...cursor.config.stack] })
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined
    }
    if (path.length) onSelectPath(path)
  }

  const focusAcceptingPath = () => {
    if (!acceptedNode) return
    setShowDead(false)
    selectNode(acceptedNode.id)
  }

  return (
    <section className="panel execution-tree-panel" id="execution-tree">
      <div className="panel-heading">
        <div><span>NPDA EXECUTION TREE</span><span className="heading-separator">/</span><span>{visibleSourceNodes.length}/{result.nodes.length} NODES</span></div>
        <div className="tree-tools">
          <button type="button" onClick={() => setShowDead((value) => !value)}>{showDead ? 'Hide dead' : 'Show dead'}</button>
          <button type="button" disabled={!acceptedNode} onClick={focusAcceptingPath}>Focus accept</button>
          <span>{result.truncated ? 'BOUNDED' : 'COMPLETE'}</span>
        </div>
      </div>
      <div className="execution-tree-scroller">
        <svg viewBox={`0 0 760 ${height}`} className="execution-tree-svg" role="group" aria-label="Nondeterministic PDA execution tree">
          {positioned.filter((node) => node.parentId).map((node) => {
            const parent = positioned.find((candidate) => candidate.id === node.parentId)
            if (!parent) return null
            const midY = (parent.y + node.y) / 2
            const onAcceptingPath = acceptingPath.has(node.id) && acceptingPath.has(parent.id)
            return <path key={`edge-${node.id}`} className={`tree-edge ${node.status} ${onAcceptingPath ? 'accepting-path' : ''}`} d={`M ${parent.x} ${parent.y + 18} C ${parent.x} ${midY}, ${node.x} ${midY}, ${node.x} ${node.y - 18}`} />
          })}
          {positioned.map((node) => (
            <g
              key={node.id}
              className={`tree-node ${node.status} ${acceptingPath.has(node.id) ? 'accepting-path' : ''} ${selected?.id === node.id ? 'selected' : ''}`}
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
        <div className="tree-inspector" aria-live="polite" tabIndex={0}>
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
