import { PdaVsDfaLab } from './PdaVsDfaLab'
import '../styles/learn.css'

interface LearnCenterProps {
  onBack: () => void
  onOpenDebugger: (input: string) => void
  onNavigate: (target: 'derivations' | 'analysis' | 'conversion' | 'designer' | 'tests' | 'challenges' | 'examples') => void
}

const tutorials = [
  {
    id: 'cfg-pda',
    number: '01',
    title: 'CFG generation → PDA recognition',
    summary: 'A grammar expands variables to generate strings. A PDA recognizes the same context-free structure by storing pending work on a stack.',
    path: ['Start with S', 'Choose a production', 'Push / replace stack symbols', 'Match terminals', 'Accept when input + stack condition agree'],
    action: 'conversion' as const,
    actionLabel: 'Open CFG → PDA',
  },
  {
    id: 'npda',
    number: '02',
    title: 'Why nondeterminism creates branches',
    summary: 'When multiple consuming or ε-transitions are enabled, an NPDA explores every legal next configuration. One dead branch does not mean the input is rejected.',
    path: ['Configuration', 'Find every matching edge', 'Fork child configurations', 'Kill blocked branches', 'Accept if any branch accepts'],
    action: 'challenges' as const,
    actionLabel: 'Debug a broken NPDA',
  },
  {
    id: 'acceptance',
    number: '03',
    title: 'Final state vs empty stack',
    summary: 'Both are standard PDA acceptance conventions. In StackTrace they are explicit simulator modes, so the same transition graph can be inspected under each rule.',
    path: ['Consume all input', 'Final-state mode: enter an accepting state', 'Empty-stack mode: remove every stack symbol'],
    action: 'designer' as const,
    actionLabel: 'Inspect PDA Designer',
  },
  {
    id: 'rejection',
    number: '04',
    title: 'Debug rejection, do not just read REJECTED',
    summary: 'A useful failure report identifies the furthest computation, the unread input, stack top, blocked transitions, and whether search limits prevented a proof.',
    path: ['Explore all branches', 'Rank terminated branches by progress', 'Inspect the closest branch', 'Compare input and stack guards', 'Repair the edge or state rule'],
    action: 'tests' as const,
    actionLabel: 'Open Test Bench',
  },
  {
    id: 'cfg-analysis',
    number: '05',
    title: 'FIRST, FOLLOW, recursion, factoring',
    summary: 'Static grammar analysis explains parser-facing structure before simulation: what can begin a derivation, what can follow a variable, and where grammar transformations are required.',
    path: ['Parse grammar', 'Compute nullable variables', 'Compute FIRST', 'Compute FOLLOW', 'Inspect recursion / factoring / ambiguity witnesses'],
    action: 'analysis' as const,
    actionLabel: 'Analyze current CFG',
  },
  {
    id: 'derivation',
    number: '06',
    title: 'Derivations and parse trees',
    summary: 'Leftmost and rightmost derivations choose different expansion order. A successful derivation can be reconstructed as the parse tree that records those production choices.',
    path: ['Start symbol', 'Choose expansion order', 'Apply one production', 'Track the replaced variable', 'Reconstruct the tree'],
    action: 'derivations' as const,
    actionLabel: 'Open Derivation Explorer',
  },
]

export function LearnCenter({ onBack, onOpenDebugger, onNavigate }: LearnCenterProps) {
  return (
    <section className="learn-workspace">
      <div className="learn-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div><small>LEARN</small><strong>Concepts connected directly to the tools that demonstrate them.</strong></div>
        <button onClick={() => onNavigate('examples')}>Open examples →</button>
      </div>

      <section className="learning-path panel">
        <div className="panel-heading"><span>GUIDED CONCEPT PATH</span><span>{tutorials.length} SHORT LABS</span></div>
        <div className="tutorial-grid">
          {tutorials.map((tutorial) => (
            <article className="tutorial-card" key={tutorial.id}>
              <header><span>{tutorial.number}</span><div><small>TUTORIAL</small><strong>{tutorial.title}</strong></div></header>
              <p>{tutorial.summary}</p>
              <ol>{tutorial.path.map((step) => <li key={step}>{step}</li>)}</ol>
              <button onClick={() => onNavigate(tutorial.action)}>{tutorial.actionLabel} →</button>
            </article>
          ))}
        </div>
      </section>

      <PdaVsDfaLab onOpenDebugger={onOpenDebugger} />
    </section>
  )
}
