import { useMemo, useState } from 'react'
import { acceptanceName, cap, outcomeLabel } from '../content'
import { runLanguageTests } from '../core/pda/testBench'
import type { AcceptanceMode, PDA } from '../core/pda/types'
import { challenges } from '../data/challenges'
import '../styles/challenges.css'
import '../styles/challenge-score.css'

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
  const [hintUsed, setHintUsed] = useState(false)
  const selected = challenges.find((challenge) => challenge.id === selectedId) || challenges[0]
  const isActive = activeChallengeId === selected.id
  const challengeMode = selected.acceptanceMode
  const publicResults = useMemo(() => runLanguageTests(machine, selected.publicTests, challengeMode), [machine, selected, challengeMode])
  const hiddenResults = useMemo(() => runLanguageTests(machine, selected.hiddenTests, challengeMode), [machine, selected, challengeMode])
  const publicPassedCount = publicResults.filter((result) => result.passed).length
  const hiddenPassedCount = hiddenResults.filter((result) => result.passed).length
  const publicPassed = publicPassedCount === publicResults.length
  const hiddenPassed = hiddenPassedCount === hiddenResults.length
  const solved = isActive && publicPassed && hiddenPassed
  const score = isActive
    ? Math.round((publicPassedCount / Math.max(1, publicResults.length)) * 40 + (hiddenPassedCount / Math.max(1, hiddenResults.length)) * 50 + (hintUsed ? 0 : 10))
    : 0

  const startChallenge = () => {
    onSetActiveChallenge(selected.id)
    onLoadMachine({
      ...selected.brokenMachine,
      states: selected.brokenMachine.states.map((state) => ({ ...state })),
      transitions: selected.brokenMachine.transitions.map((transition) => ({ ...transition })),
    })
    setShowHint(false)
    setHintUsed(false)
  }

  const toggleHint = () => {
    if (!showHint) setHintUsed(true)
    setShowHint((value) => !value)
  }

  const selectChallenge = (id: string) => {
    setSelectedId(id)
    setShowHint(false)
    if (id !== activeChallengeId) setHintUsed(false)
  }

  return (
    <section className="challenge-workspace">
      <div className="challenge-toolbar">
        <button onClick={onBack}>← Workspace</button>
        <div><strong>Repair lab</strong></div>
      </div>

      <div className="challenge-layout">
        <aside className="panel challenge-list">
          <div className="panel-heading"><span>Challenges</span><span>{challenges.length} levels</span></div>
          {challenges.map((challenge) => (
            <button key={challenge.id} className={challenge.id === selected.id ? 'selected' : ''} onClick={() => selectChallenge(challenge.id)}>
              <span><b><em>L{challenge.level}</em>{challenge.title}</b><small>{cap(challenge.concept)}</small></span>
              <i>{challenge.id === activeChallengeId ? 'Active' : challenge.difficulty}</i>
            </button>
          ))}
        </aside>

        <div className="challenge-main">
          <section className="panel challenge-briefing">
            <div className="panel-heading"><div><span>Level {selected.level}</span><span className="heading-separator">/</span><span>{selected.title}</span></div><span>{isActive ? 'Active' : 'Not started'}</span></div>
            <div className="challenge-copy"><p>{selected.briefing}</p></div>
            <div className="challenge-mode-note">
              <small>Checks with</small>
              <strong>{acceptanceName(challengeMode)}</strong>
              {mode !== challengeMode && <span>Debugger uses {acceptanceName(mode)}; scoring uses {acceptanceName(challengeMode)}.</span>}
            </div>
            <div className="challenge-actions">
              <button className="primary-control" onClick={startChallenge}>{isActive ? 'Restart broken machine' : 'Start challenge'}</button>
              <button disabled={!isActive} onClick={onOpenDesigner}>Open builder</button>
              <button onClick={toggleHint}>{showHint ? 'Hide hint' : 'Show hint'}</button>
            </div>
            {showHint && <div className="challenge-hint"><small>Hint</small><span>{selected.hint}</span></div>}
          </section>

          <section className="panel challenge-tests">
            <div className="panel-heading"><span>Validation</span><span>{solved ? 'Solved' : isActive ? 'Checking' : 'Not started'}</span></div>
            <div className="challenge-score challenge-score-four">
              <div className={isActive && publicPassed ? 'pass' : isActive ? 'fail' : ''}><small>Public / 40</small><strong>{isActive ? `${publicPassedCount}/${publicResults.length}` : 'Waiting'}</strong></div>
              <div className={isActive && hiddenPassed ? 'pass' : isActive ? 'fail' : ''}><small>Hidden / 50</small><strong>{isActive ? `${hiddenPassedCount}/${hiddenResults.length}` : 'Waiting'}</strong></div>
              <div className={isActive && !hintUsed ? 'pass' : isActive ? 'hint-used' : ''}><small>No hint / 10</small><strong>{isActive ? hintUsed ? '0' : '10' : 'Waiting'}</strong></div>
              <div className={solved ? 'pass total-score' : 'total-score'}><small>Score</small><strong>{isActive ? `${score}/100` : 'Waiting'}</strong></div>
            </div>

            <div className="challenge-result-list">
              {selected.publicTests.map((test, index) => {
                const result = publicResults[index]
                return <div key={test.id} className={isActive ? result.passed ? 'pass' : 'fail' : ''}>
                  <span>{cap(test.expectation)}</span>
                  <b>{test.input || 'ε'}</b>
                  <small>{isActive ? outcomeLabel(result.outcome) : 'Waiting'}</small>
                  <i>{isActive ? result.passed ? 'Pass' : 'Fail' : 'Waiting'}</i>
                </div>
              })}
              {selected.hiddenTests.map((test, index) => (
                <div key={test.id} className={isActive ? hiddenResults[index]?.passed ? 'pass hidden' : 'fail hidden' : 'hidden'}>
                  <span>Hidden</span><b>••••</b><small>{isActive ? hiddenResults[index]?.outcome ? outcomeLabel(hiddenResults[index].outcome) : 'Waiting' : 'Waiting'}</small><i>{isActive ? hiddenResults[index]?.passed ? 'Pass' : 'Fail' : 'Waiting'}</i>
                </div>
              ))}
            </div>
            {solved && <div className="challenge-solved"><span>✓</span><div><strong>Level {selected.level} repaired: {score}/100.</strong><small>All public and hidden tests pass ({acceptanceName(challengeMode)}).</small></div></div>}
          </section>
        </div>
      </div>
    </section>
  )
}
