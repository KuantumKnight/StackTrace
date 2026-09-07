import { useMemo, useState } from 'react'
import { runLanguageTests } from '../core/pda/testBench'
import type { AcceptanceMode, PDA } from '../core/pda/types'
import { challenges } from '../data/challenges'
import '../styles/challenges.css'

interface ChallengeModeProps {
  machine: PDA
  mode: AcceptanceMode
  activeChallengeId: string | null
  onSetActiveChallenge: (id: string | null) => void
  onLoadMachine: (machine: PDA) => void
  onOpenDesigner: () => void
  onBack: () => void
}

export function ChallengeMode({ machine, mode, activeChallengeId, onSetActiveChallenge, onLoadMachine, onOpenDesigner, onBack }: ChallengeModeProps) {
  const [selectedId, setSelectedId] = useState(activeChallengeId || challenges[0].id)
  const [showHint, setShowHint] = useState(false)
  const selected = challenges.find((challenge) => challenge.id === selectedId) || challenges[0]
  const isActive = activeChallengeId === selected.id
  const publicResults = useMemo(() => runLanguageTests(machine, selected.publicTests, mode), [machine, selected, mode])
  const hiddenResults = useMemo(() => runLanguageTests(machine, selected.hiddenTests, mode), [machine, selected, mode])
  const publicPassed = publicResults.every((result) => result.passed)
  const hiddenPassed = hiddenResults.every((result) => result.passed)
  const solved = isActive && publicPassed && hiddenPassed

  const startChallenge = () => {
    onSetActiveChallenge(selected.id)
    onLoadMachine({
      ...selected.brokenMachine,
      states: selected.brokenMachine.states.map((state) => ({ ...state })),
      transitions: selected.brokenMachine.transitions.map((transition) => ({ ...transition })),
    })
    setShowHint(false)
  }

  return (
    <section className="challenge-workspace">
      <div className="challenge-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div><small>REPAIR LAB</small><strong>Debug the machine, then prove the repair.</strong></div>
      </div>

      <div className="challenge-layout">
        <aside className="panel challenge-list">
          <div className="panel-heading"><span>CHALLENGES</span><span>{challenges.length} LABS</span></div>
          {challenges.map((challenge) => (
            <button key={challenge.id} className={challenge.id === selected.id ? 'selected' : ''} onClick={() => { setSelectedId(challenge.id); setShowHint(false) }}>
              <span><b>{challenge.title}</b><small>{challenge.concept}</small></span>
              <i>{challenge.id === activeChallengeId ? 'ACTIVE' : challenge.difficulty}</i>
            </button>
          ))}
        </aside>

        <div className="challenge-main">
          <section className="panel challenge-briefing">
            <div className="panel-heading"><div><span>{selected.title.toUpperCase()}</span><span className="heading-separator">/</span><span>{selected.difficulty.toUpperCase()}</span></div><span>{isActive ? 'ACTIVE' : 'NOT STARTED'}</span></div>
            <div className="challenge-copy"><small>MISSION</small><p>{selected.briefing}</p></div>
            <div className="challenge-actions">
              <button className="primary-control" onClick={startChallenge}>{isActive ? 'Restart broken machine' : 'Start challenge'}</button>
              <button disabled={!isActive} onClick={onOpenDesigner}>Open Designer</button>
              <button onClick={() => setShowHint((value) => !value)}>{showHint ? 'Hide hint' : 'Show hint'}</button>
            </div>
            {showHint && <div className="challenge-hint"><small>HINT</small><span>{selected.hint}</span></div>}
          </section>

          <section className="panel challenge-tests">
            <div className="panel-heading"><span>VALIDATION</span><span>{solved ? 'SOLVED' : isActive ? 'CHECKING CURRENT MACHINE' : 'START TO EDIT'}</span></div>
            <div className="challenge-score">
              <div className={isActive && publicPassed ? 'pass' : isActive ? 'fail' : ''}><small>PUBLIC</small><strong>{isActive ? `${publicResults.filter((result) => result.passed).length}/${publicResults.length}` : '—'}</strong></div>
              <div className={isActive && hiddenPassed ? 'pass' : isActive ? 'fail' : ''}><small>HIDDEN</small><strong>{isActive ? `${hiddenResults.filter((result) => result.passed).length}/${hiddenResults.length}` : '—'}</strong></div>
              <div className={solved ? 'pass' : ''}><small>STATUS</small><strong>{solved ? 'SOLVED' : isActive ? 'IN PROGRESS' : 'IDLE'}</strong></div>
            </div>

            <div className="challenge-result-list">
              {selected.publicTests.map((test, index) => {
                const result = publicResults[index]
                return <div key={test.id} className={isActive ? result.passed ? 'pass' : 'fail' : ''}>
                  <span>{test.expectation.toUpperCase()}</span>
                  <b>{test.input || 'ε'}</b>
                  <small>{isActive ? result.outcome.toUpperCase() : 'PENDING'}</small>
                  <i>{isActive ? result.passed ? 'PASS' : 'FAIL' : '—'}</i>
                </div>
              })}
              {selected.hiddenTests.map((test, index) => (
                <div key={test.id} className={isActive ? hiddenResults[index]?.passed ? 'pass hidden' : 'fail hidden' : 'hidden'}>
                  <span>HIDDEN</span><b>••••</b><small>{isActive ? hiddenResults[index]?.outcome.toUpperCase() : 'PENDING'}</small><i>{isActive ? hiddenResults[index]?.passed ? 'PASS' : 'FAIL' : '—'}</i>
                </div>
              ))}
            </div>
            {solved && <div className="challenge-solved"><span>✓</span><div><strong>Repair verified.</strong><small>All public and hidden assertions pass on the current PDA.</small></div></div>}
          </section>
        </div>
      </div>
    </section>
  )
}
