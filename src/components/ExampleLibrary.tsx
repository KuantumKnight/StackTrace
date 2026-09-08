import { useState } from 'react'
import { acceptanceName } from '../content'
import { makeSnapshot, type WorkspaceSnapshot, type WorkspaceStateInput } from '../core/workspace/persistence'
import { deleteSavedWorkspace, loadSavedWorkspaces, saveNamedWorkspace } from '../core/workspace/savedExamples'
import { stackTraceExamples } from '../data/examples'
import type { PDA } from '../core/pda/types'
import '../styles/examples.css'

interface ExampleLibraryProps {
  workspace: WorkspaceStateInput
  onLoad: (snapshot: WorkspaceSnapshot) => void
  onBack: () => void
}

function cloneMachine(machine: PDA): PDA {
  return {
    ...machine,
    states: machine.states.map((state) => ({ ...state })),
    transitions: machine.transitions.map((transition) => ({ ...transition })),
  }
}

function formatSavedTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'unknown time'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

export function ExampleLibrary({ workspace, onLoad, onBack }: ExampleLibraryProps) {
  const [saved, setSaved] = useState(loadSavedWorkspaces)
  const [name, setName] = useState('')
  const [notice, setNotice] = useState('')

  const saveCurrent = () => {
    try {
      const next = saveNamedWorkspace(name, workspace)
      setSaved(next)
      setNotice(`Saved “${name.trim()}”.`)
      setName('')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save workspace.')
    }
  }

  const loadBuiltin = (index: number) => {
    const example = stackTraceExamples[index]
    onLoad(makeSnapshot({
      grammar: example.grammar,
      input: example.sampleInput,
      acceptanceMode: example.acceptanceMode,
      machine: cloneMachine(example.machine),
      activeChallengeId: null,
    }))
  }

  return (
    <section className="examples-workspace">
      <div className="examples-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div><strong>Examples</strong></div>
      </div>

      <section className="panel save-workspace-panel">
        <div className="panel-heading"><span>Save workspace</span></div>
        <div className="save-workspace-row">
          <label><span>Name</span><input value={name} maxLength={48} placeholder="e.g. My palindrome PDA" onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && saveCurrent()} /></label>
          <button className="primary-control" onClick={saveCurrent}>Save snapshot</button>
          {notice && <span className="save-notice" role="status">{notice}</span>}
        </div>
      </section>

      <div className="examples-grid">
        <section className="panel example-section">
          <div className="panel-heading"><span>Built-in examples</span><span>{stackTraceExamples.length} verified</span></div>
          <div className="example-card-list">
            {stackTraceExamples.map((example, index) => (
              <article className="example-card" key={example.id}>
                <div className="example-card-head"><div><small>{example.language}</small><strong>{example.title}</strong></div><span>{acceptanceName(example.acceptanceMode)}</span></div>
                <pre>{example.grammar}</pre>
                <p>{example.lesson}</p>
                <div className="example-samples"><span><small>Accepts</small>{example.accepts.slice(0, 4).map((value) => <code key={`a-${value}`}>{value || 'ε'}</code>)}</span><span><small>Rejects</small>{example.rejects.slice(0, 4).map((value) => <code key={`r-${value}`}>{value || 'ε'}</code>)}</span></div>
                <button onClick={() => loadBuiltin(index)}>Load into debugger</button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel example-section saved-section">
          <div className="panel-heading"><span>Saved</span><span>{saved.length}/{24}</span></div>
          {saved.length ? <div className="saved-list">
            {saved.map((item) => (
              <div className="saved-row" key={item.id}>
                <div><strong>{item.name}</strong><small>{item.snapshot.grammar.split('\n')[0] || 'No grammar'} ({formatSavedTime(item.updatedAt)})</small></div>
                <span>{item.snapshot.machine.states.length} states, {item.snapshot.machine.transitions.length} edges</span>
                <button onClick={() => onLoad(item.snapshot)}>Load</button>
                <button className="danger-button" onClick={() => setSaved(deleteSavedWorkspace(item.id))}>Delete</button>
              </div>
            ))}
          </div> : <div className="saved-empty"><strong>No saved machines yet.</strong><span>Work autosaves. Name a snapshot to keep it.</span></div>}
        </section>
      </div>
    </section>
  )
}
