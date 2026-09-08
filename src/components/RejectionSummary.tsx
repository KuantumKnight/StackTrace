import { useMemo } from 'react'
import { analyzePDAOutcome } from '../core/pda/rejectionAnalysis'
import type { AcceptanceMode, PDA } from '../core/pda/types'
import '../styles/rejectionSummary.css'

interface RejectionSummaryProps {
  machine: PDA
  input: string
  mode: AcceptanceMode
}

export function RejectionSummary({ machine, input, mode }: RejectionSummaryProps) {
  const analysis = useMemo(() => analyzePDAOutcome(machine, input, mode), [machine, input, mode])

  if (analysis.verdict === 'accepted') {
    return (
      <div className="global-verdict branch-survives">
        <div><small>All branches</small><strong>Another branch accepts this input.</strong></div>
        <span>Accepting path at depth {analysis.acceptingDepth}. Open the tree and press Focus accept.</span>
      </div>
    )
  }

  if (analysis.verdict === 'limit') {
    return (
      <div className="global-verdict search-limited">
        <div><small>All branches</small><strong>Inconclusive: hit a search limit.</strong></div>
        <span>{analysis.explored} explored, {analysis.deadBranches} dead, {analysis.limitedBranches} limited. Not proven rejected.</span>
        {analysis.closest && <code>closest: ({analysis.closest.state}, {analysis.closest.input.slice(analysis.closest.inputIndex) || 'ε'}, {analysis.closest.stack.join('') || 'ε'})</code>}
      </div>
    )
  }

  return (
    <div className="global-verdict search-rejected">
      <div><small>All branches</small><strong>Rejected: every branch ends.</strong></div>
      <span>{analysis.explored} explored, {analysis.deadBranches} dead, none accept.</span>
      {analysis.closest && <div className="closest-branch">
        <small>Closest branch</small>
        <code>({analysis.closest.state}, {analysis.closest.input.slice(analysis.closest.inputIndex) || 'ε'}, {analysis.closest.stack.join('') || 'ε'})</code>
        <span>{analysis.closest.reason || 'No accepting transition remains.'}</span>
      </div>}
    </div>
  )
}
