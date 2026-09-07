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
  const [showHint, setShowHint] = useState(false)
  const selected = challenges.find((challenge) => challenge.id === activeChallengeId) || challenges[0]
  const publicResults = useMemo(() => runLanguageTests(machine, selected.publicTests, mode), [machine, selected, mode])
  const hiddenResults = useMemo(() => runLanguageTests(machine, selected.hiddenTests, mode), [machine, selected, mode])
  const publicPassed = publicResults.every((result) => result.passed)
  const hiddenPassed = hiddenResults.every((result) => result.passed)
  const solved = activeChallengeId === selected.id && publicPassed && hiddenPassed

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
            <button key={challenge.id} className={challenge.id === selected.id ? 'selected' : ''} onClick={() => { onSetActiveChallenge(challenge.id); setShowHint(false) }}>
              <span><b>{challenge.title}</b><small>{challenge.concept}</small></span>
              <i>{challenge.difficulty}</i>
            </button>
          ))}
        </aside>

        <div className="challenge-main">
          <section className="panel challenge-briefing">
            <div className="panel-heading"><div><span>{selected.title.toUpperCase()}</span><span className="heading-separator">/</span><span>{selected.difficulty.toUpperCase()}</span></div><span>{activeChallengeId === selected.id ? 'ACTIVE' : 'NOT STARTED'}</span></div>
            <div className="challenge-copy"><small>MISSION</small><p>{selected.briefing}</p></div>
            <div className="challenge-actions">
              <button className="primary-control" onClick={startChallenge}>{activeChallengeId === selected.id ? 'Restart broken machine' : 'Start challenge'}</button>
              <button disabled={activeChallengeId !== selected.id} onClick={onOpenDesigner}>Open Designer</button>
              <button onClick={() => setShowHint((value) => !value)}>{showHint ? 'Hide hint' : 'Show hint'}</button>
            </div>
            {showHint && <div className="challenge-hint"><small>HINT</small><span>{selected.hint}</span></div>}
          </section>

          <section className="panel challenge-tests">
            <div className="panel-heading"><span>VALIDATION</span><span>{solved ? 'SOLVED' : activeChallengeId === selected.id ? 'CHECKING CURRENT MACHINE' : 'START TO EDIT'}</span></div>
            <div className="challenge-score">
              <div className={publicPassed ? 'pass' : 'fail'}><small>PUBLIC</small><strong>{publicResults.filter((result) => result.passed).length}/{publicResults.length}</strong></div>
              <div className={hiddenPassed ? 'pass' : 'fail'}><small>HIDDEN</small><strong>{hiddenResults.filter((result) => result.passed).length}/{hiddenResults.length}</strong></div>
              <div className={solved ? 'pass' : ''}><small>STATUS</small><strong>{solved ? 'SOLVED' : 'IN PROGRESS'}</strong></div>
            </div>

            <div className="challenge-result-list">
              {publicResults.map((result) => (
                <div key={result.id} className={result.passed ? 'pass' : 'fail'}>
                  <span>{result.expectation.toUpperCase()}</span>
                  <b>{result.input || 'ε'}</b>
                  <small>{result.outcome.toUpperCase()}</small>
                  <i>{result.passed ? 'PASS' : 'FAIL'}</i>
                </div>
              ))}
              {selected.hiddenTests.map((test, index) => (
                <div key={test.id} className={hiddenResults[index]?.passed ? 'pass hidden' : 'fail hidden'}>
                  <span>HIDDEN</span><b>••••</b><small>{hiddenResults[index]?.outcome.toUpperCase()}</small><i>{hiddenResults[index]?.passed ? 'PASS' : 'FAIL'}</i>
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
