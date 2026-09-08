// StackTrace product copy.
//
// TONE RULES — apply to every user-visible string, here or inline in components:
// - Sentence case everywhere. ALL CAPS only for PDA, NPDA, CFG, FIRST, FOLLOW, ID.
// - Max 12 words per helper sentence. Max 1 sentence per hint.
// - Verb-first buttons: Run, Step, Reset, Load, Save, Share.
// - No "In StackTrace…", no "X, not Y" contrasts, no "·" lists.
// - Arrows (→) only for formal notation (transition rules, CFG → PDA) and paired
//   back/forward movement. Nowhere else.
// - One title per panel, no subtitles. If the UI already shows it, don't say it.

import type { AcceptanceMode, Configuration } from './core/pda/types'

export function cap(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

export function acceptanceName(mode: AcceptanceMode): string {
  return mode === 'final-state' ? 'Final state' : 'Empty stack'
}

export function configStatusLabel(status: Configuration['status']): string {
  if (status === 'accepted') return 'Accepted'
  if (status === 'dead') return 'Dead branch'
  if (status === 'limit') return 'Search limit'
  return 'Ready'
}

export function outcomeLabel(outcome: 'accepted' | 'rejected' | 'limit'): string {
  if (outcome === 'accepted') return 'Accepted'
  if (outcome === 'rejected') return 'Rejected'
  return 'Limit'
}

export function derivationStatusLabel(status: 'found' | 'not-found' | 'limit'): string {
  if (status === 'found') return 'Found'
  if (status === 'limit') return 'Limit'
  return 'Not found'
}

export const heroCopy = {
  eyebrow: 'Live trace: aⁿbⁿ',
  title: 'Trace why a PDA accepts or rejects.',
}

export interface GuideStep {
  id: string
  label: string
  target: string
}

export const guideSteps: GuideStep[] = [
  { id: '01', label: 'Define the language', target: 'section-language' },
  { id: '02', label: 'Trace the machine', target: 'section-graph' },
  { id: '03', label: 'Watch the stack', target: 'section-memory' },
  { id: '04', label: 'Explain the outcome', target: 'section-playback' },
]

export const railCopy = {
  language: 'Define the language',
  graph: 'Trace the machine',
  memory: 'Memory',
}

export const playbackCopy = {
  title: 'Playback',
  hint: 'Space steps, Shift+Space runs, Alt+←/→ moves through history',
}

export const footerCopy = {
  tagline: 'A PDA debugger for learning formal languages.',
}

export const paletteCopy = {
  placeholder: 'Jump to a tool…',
  footerNote: 'Commands',
  shortcut: 'Ctrl/⌘ K',
  empty: 'No matching command.',
}

export type LearnAction = 'derivations' | 'analysis' | 'conversion' | 'designer' | 'tests' | 'challenges' | 'examples'

export interface Tutorial {
  id: string
  number: string
  title: string
  summary: string
  path: string[]
  action: LearnAction
  actionLabel: string
}

export const tutorials: Tutorial[] = [
  {
    id: 'cfg-pda',
    number: '01',
    title: 'From CFG to PDA',
    summary: 'Grammars generate strings by expanding variables. PDAs recognize them by storing work on a stack.',
    path: ['Start with S', 'Choose a production', 'Push / replace stack symbols', 'Match terminals', 'Accept when input and stack agree'],
    action: 'conversion',
    actionLabel: 'Open CFG → PDA',
  },
  {
    id: 'npda',
    number: '02',
    title: 'Why nondeterminism creates branches',
    summary: 'When several transitions match, an NPDA explores every next configuration. One dead branch does not reject the input.',
    path: ['Configuration', 'Find every matching edge', 'Fork child configurations', 'Drop blocked branches', 'Accept if any branch accepts'],
    action: 'challenges',
    actionLabel: 'Try a repair',
  },
  {
    id: 'acceptance',
    number: '03',
    title: 'Final state vs empty stack',
    summary: 'Final-state and empty-stack are both standard. Switch modes to compare.',
    path: ['Consume all input', 'Final-state mode: enter an accepting state', 'Empty-stack mode: remove every stack symbol'],
    action: 'designer',
    actionLabel: 'Open builder',
  },
  {
    id: 'rejection',
    number: '04',
    title: 'Why did it reject?',
    summary: 'Rank dead branches by progress and inspect the closest one.',
    path: ['Explore all branches', 'Rank terminated branches by progress', 'Inspect the closest branch', 'Compare input and stack guards', 'Repair the edge or state rule'],
    action: 'tests',
    actionLabel: 'Open tests',
  },
  {
    id: 'cfg-analysis',
    number: '05',
    title: 'FIRST, FOLLOW, recursion, factoring',
    summary: 'See FIRST/FOLLOW sets and where the grammar needs fixing.',
    path: ['Parse grammar', 'Compute nullable variables', 'Compute FIRST', 'Compute FOLLOW', 'Check recursion, factoring, ambiguity'],
    action: 'analysis',
    actionLabel: 'Analyze current CFG',
  },
  {
    id: 'derivation',
    number: '06',
    title: 'Derivations and parse trees',
    summary: 'Leftmost vs rightmost: same tree, different order.',
    path: ['Start symbol', 'Choose expansion order', 'Apply one production', 'Track the replaced variable', 'Reconstruct the tree'],
    action: 'derivations',
    actionLabel: 'Open derivations',
  },
]
