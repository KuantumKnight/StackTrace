import type { Configuration } from '../core/pda/types'

interface StackTimelineProps {
  history: Configuration[]
  activeIndex: number
  onSelect: (index: number) => void
}

export function StackTimeline({ history, activeIndex, onSelect }: StackTimelineProps) {
  const width = 560
  const height = 118
  const padX = 28
  const padTop = 14
  const padBottom = 24
  const maxDepth = Math.max(1, ...history.map((config) => config.stack.length))
  const usableWidth = width - padX * 2
  const usableHeight = height - padTop - padBottom
  const xFor = (index: number) => history.length <= 1 ? padX : padX + (index / (history.length - 1)) * usableWidth
  const yFor = (depth: number) => padTop + usableHeight - (depth / maxDepth) * usableHeight
  const points = history.map((config, index) => `${xFor(index)},${yFor(config.stack.length)}`).join(' ')

  return (
    <section className="stack-timeline-card">
      <div className="mini-heading">
        <span>STACK HEIGHT</span>
        <span>memory over execution</span>
      </div>
      <svg className="stack-timeline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Stack height over execution">
        {[0, .5, 1].map((ratio) => (
          <line key={ratio} className="timeline-gridline" x1={padX} x2={width - padX} y1={padTop + usableHeight * ratio} y2={padTop + usableHeight * ratio} />
        ))}
        <polyline className="timeline-area-line" points={points} />
        {history.map((config, index) => (
          <g className={`timeline-point ${index === activeIndex ? 'active' : ''}`} key={config.id} onClick={() => onSelect(index)} role="button" tabIndex={0} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onSelect(index)}>
            <circle cx={xFor(index)} cy={yFor(config.stack.length)} r={index === activeIndex ? 5 : 3.5} />
            {index === activeIndex && <text x={xFor(index)} y={yFor(config.stack.length) - 11} textAnchor="middle">{config.stack.length}</text>}
          </g>
        ))}
        <text className="timeline-axis-label" x={padX} y={height - 5}>C0</text>
        <text className="timeline-axis-label" x={width - padX} y={height - 5} textAnchor="end">C{Math.max(0, history.length - 1)}</text>
      </svg>
    </section>
  )
}
