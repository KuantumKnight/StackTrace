import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpIcon, CommandIcon, MoonIcon, SearchIcon, SunIcon } from './LucideIcons'

type Theme = 'paper' | 'night'

type ExperienceDestination = 'debug' | 'learn' | 'build' | 'practice'

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'paper'
  let saved: string | null = null
  try {
    saved = window.localStorage.getItem('stacktrace-theme')
  } catch {
    // Theme preference is optional; fall back to the system preference.
  }
  if (saved === 'paper' || saved === 'night') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'night' : 'paper'
}

export function ExperienceLayer() {
  const [theme, setTheme] = useState<Theme>(() => readTheme())
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showTop, setShowTop] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const paletteInputRef = useRef<HTMLInputElement>(null)
  const lastFocusedElementRef = useRef<HTMLElement | null>(null)
  const navigate = (destination: ExperienceDestination) => {
    window.dispatchEvent(new CustomEvent<ExperienceDestination>('stacktrace:navigate', { detail: destination }))
  }
  const commands = useMemo(() => [
    { id: 'debug', label: 'Open debugger', hint: 'D', action: () => navigate('debug') },
    { id: 'learn', label: 'Open Learn', hint: 'L', action: () => navigate('learn') },
    { id: 'build', label: 'Open Build', hint: 'B', action: () => navigate('build') },
    { id: 'practice', label: 'Open Practice', hint: 'P', action: () => navigate('practice') },
    { id: 'top', label: 'Back to top', hint: '↑', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
  ], [])

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return normalized ? commands.filter((command) => command.label.toLowerCase().includes(normalized)) : commands
  }, [query])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      window.localStorage.setItem('stacktrace-theme', theme)
    } catch {
      // Theme persistence is best-effort and must not block the app.
    }
  }, [theme])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const root = document.documentElement
    const onScroll = () => {
      const max = Math.max(root.scrollHeight - window.innerHeight, 1)
      const progress = Math.min(1, window.scrollY / max)
      setScrollProgress(progress)
      setShowTop(window.scrollY > 720)
      root.dataset.scrolled = window.scrollY > 24 ? 'true' : 'false'
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (paletteOpen) {
      paletteInputRef.current?.focus()
      const onPaletteKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          setPaletteOpen(false)
          return
        }
        if (event.key !== 'Tab') return
        const dialog = event.currentTarget instanceof Window
          ? document.querySelector<HTMLElement>('[aria-label="Command palette"]')
          : null
        const focusable = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')) : []
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
      window.addEventListener('keydown', onPaletteKeyDown)
      return () => window.removeEventListener('keydown', onPaletteKeyDown)
    }
    lastFocusedElementRef.current?.focus()
    lastFocusedElementRef.current = null
  }, [paletteOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (!paletteOpen) lastFocusedElementRef.current = document.activeElement as HTMLElement | null
        setPaletteOpen((value) => !value)
      }
      if (event.key === 'Escape') setPaletteOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [paletteOpen])

  const cycleTheme = () => {
    const next = theme === 'night' ? 'paper' : 'night'
    setTheme(next)
    setToast(next === 'night' ? 'Night theme enabled' : 'Paper theme enabled')
  }

  const themeIcon = theme === 'night' ? <MoonIcon /> : <SunIcon />
  const openPalette = () => {
    lastFocusedElementRef.current = document.activeElement as HTMLElement | null
    setPaletteOpen(true)
  }

  return (
    <>
      <div className="scroll-progress" aria-hidden="true"><span style={{ transform: `scaleX(${scrollProgress})` }} /></div>

      <div className="experience-controls" aria-label="Experience controls">
        <button className="icon-button theme-button" type="button" onClick={cycleTheme} aria-label={`Theme: ${theme === 'night' ? 'Night' : 'Paper'}. Change theme`} title={`Theme: ${theme === 'night' ? 'Night' : 'Paper'}`}>
          {themeIcon}
        </button>
        <button className="command-button" type="button" onClick={openPalette} aria-label="Open command palette">
          <SearchIcon /><span>Search</span><kbd><CommandIcon />K</kbd>
        </button>
      </div>

      {showTop && <button className="back-to-top" type="button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUpIcon /></button>}

      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}

      {paletteOpen && (
        <div className="command-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setPaletteOpen(false) }}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
            <div className="command-search">
              <SearchIcon />
              <input ref={paletteInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search commands…" aria-label="Search commands" />
              <kbd>ESC</kbd>
            </div>
            <div className="command-list">
              {filteredCommands.map((command) => (
                <button key={command.id} type="button" onClick={() => { command.action(); setPaletteOpen(false); setQuery(''); setToast(command.label) }}>
                  <span>{command.label}</span><kbd>{command.hint}</kbd>
                </button>
              ))}
              {!filteredCommands.length && <p>No matching command.</p>}
            </div>
            <footer><span>Ctrl/⌘ K</span></footer>
          </section>
        </div>
      )}

    </>
  )
}
