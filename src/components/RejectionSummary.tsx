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
        <div><small>WHOLE NPDA SEARCH</small><strong>Another branch accepts this input.</strong></div>
        <span>The selected branch terminated, but an accepting computation exists at depth {analysis.acceptingDepth}. Use the execution tree and “Focus accept” instead of treating this branch death as rejection.</span>
      </div>
    )
  }

  if (analysis.verdict === 'limit') {
    return (
      <div className="global-verdict search-limited">
        <div><small>WHOLE NPDA SEARCH</small><strong>Inconclusive — execution limit reached.</strong></div>
        <span>{analysis.explored} configurations explored · {analysis.deadBranches} dead · {analysis.limitedBranches} limited. StackTrace does not label this input rejected because the bounded search did not prove that.</span>
        {analysis.closest && <code>closest: ({analysis.closest.state}, {analysis.closest.input.slice(analysis.closest.inputIndex) || 'ε'}, {analysis.closest.stack.join('') || 'ε'})</code>}
      </div>
    )
  }

  return (
    <div className="global-verdict search-rejected">
      <div><small>WHOLE NPDA SEARCH</small><strong>Rejected — every explored computation terminates.</strong></div>
      <span>{analysis.explored} configurations explored · {analysis.deadBranches} dead branches · no accepting branch.</span>
      {analysis.closest && <div className="closest-branch">
        <small>CLOSEST BRANCH</small>
        <code>({analysis.closest.state}, {analysis.closest.input.slice(analysis.closest.inputIndex) || 'ε'}, {analysis.closest.stack.join('') || 'ε'})</code>
        <span>{analysis.closest.reason || 'No accepting transition remains.'}</span>
      </div>}
    </div>
  )
}
