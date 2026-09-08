import { PdaVsDfaLab } from './PdaVsDfaLab'
import { tutorials, type LearnAction } from '../content'
import '../styles/learn.css'

interface LearnCenterProps {
  onBack: () => void
  onOpenDebugger: (input: string) => void
  onNavigate: (target: LearnAction) => void
}

export function LearnCenter({ onBack, onOpenDebugger, onNavigate }: LearnCenterProps) {
  return (
    <section className="learn-workspace">
      <div className="learn-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div><strong>Learn</strong></div>
        <button onClick={() => onNavigate('examples')}>Open examples</button>
      </div>

      <section className="learning-path panel">
        <div className="panel-heading"><span>Concepts</span><span>{tutorials.length} guides</span></div>
        <div className="tutorial-grid">
          {tutorials.map((tutorial) => (
            <article className="tutorial-card" key={tutorial.id}>
              <header><span>{tutorial.number}</span><div><strong>{tutorial.title}</strong></div></header>
              <p>{tutorial.summary}</p>
              <ol>{tutorial.path.map((step) => <li key={step}>{step}</li>)}</ol>
              <button onClick={() => onNavigate(tutorial.action)}>{tutorial.actionLabel}</button>
            </article>
          ))}
        </div>
      </section>

      <PdaVsDfaLab onOpenDebugger={onOpenDebugger} />
    </section>
  )
}
